/**
* @file main file
*/

const program = require('commander');
const packageJson = require('./package.json');
const filesize = require('filesize');
const moment = require('moment');
const inquirer = require('inquirer');
const spawn = require('child_process').spawn;
const getPackageDetails = require('./lib/getPackageDetails');
const walkDependencies = require('./lib/walkDependencies');
const getLocalPackage = require('./lib/getLocalPackage');
const calculateImpactPackages = require('./lib/calculateImpactPackages');
const Table = require('cli-table');

function getLicenseStr(licenseObj) {
  if (typeof licenseObj === 'string') {
    return licenseObj;
  } else if (Array.isArray(licenseObj)) {
    return `(${licenseObj.map(getLicenseStr).join(` OR `)})`;
  } else if (typeof licenseObj === 'object') {
    return licenseObj.type || `Unknown`;
  }
  return `Unknown`;
}

function getPackagesStats(packages) {
  const packagesAr = Object.keys(packages);
  const count = packagesAr.length;
  const size = packagesAr.reduce((s, key) => {
    s += Number(packages[key].size);
    return s;
  }, 0);
  const licenses = packagesAr.reduce((l, key) => {
    const license = getLicenseStr(packages[key].license);
    l[license] = l[license] || 0;
    l[license] += 1;
    return l;
  }, {});
  return { count, size, licenses };
}

function showQuickStats(name, versionLoose, packages) {
  const { count, size, licenses } = getPackagesStats(packages);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`Total download packages ${count}`);
  console.log(`Total download size ${filesize(size)}`);
  console.log(`Licenses ${Object.keys(licenses).reduce((out, license) => {
    out += ` ${license}:${licenses[license]}`;
    return out;
  }, ``)}`);
}

function parseName(nameVersion) {
  let nameVersionStr = String(nameVersion).trim();
  let scope = false;
  if (nameVersionStr[0] === `@`) {
    scope = true;
    nameVersionStr = nameVersionStr.slice(1);
  }
  let [name, versionLoose] = nameVersionStr.split(`@`);
  if (!versionLoose) {
    versionLoose = `latest`;
  }
  if (scope) {
    name = `@${name}`;
  }
  return { name, versionLoose };
}

function exec(command, args) {
  spawn(command, args, {
    stdio: `inherit`
  });
}

function showImpact(name, versionLoose, newPackages) {
  return getLocalPackage().then((localPackage) => {
    const dependencies = localPackage.dependencies || {};
    const devDependencies = localPackage.devDependencies || {};
    let allDependencies;
    if (program['save-dev']) {
      allDependencies = Object.assign({}, dependencies, devDependencies);
    } else {
      allDependencies = Object.assign({}, dependencies);
    }
    return walkDependencies(allDependencies)
      .then((currentPackages) => {
        const impactPackages = calculateImpactPackages(
          newPackages, currentPackages
        );
        const currentPackagesStats = getPackagesStats(currentPackages);
        const impactPackagesStats = getPackagesStats(impactPackages);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(`Packages impact ${impactPackagesStats.count} (+${
          (impactPackagesStats.count / currentPackagesStats.count * 100).toFixed(2)
        }%)`);
        console.log(`Size impact ${filesize(impactPackagesStats.size)} (+${
          (impactPackagesStats.size / currentPackagesStats.size * 100).toFixed(2)
        }%)`);
        const newLicenses = Object.keys(impactPackagesStats.licenses).filter((license) => {
          return license === 'Unknown' || !currentPackagesStats.licenses[license];
        }).reduce((nl, license) => {
          nl[license] = impactPackagesStats.licenses[license];
          return nl;
        }, {});
        if (Object.keys(newLicenses).length) {
          console.log(`Licenses ${Object.keys(newLicenses).reduce((out, license) => {
            out += ` ${license}:${newLicenses[license]}`;
            return out;
          }, ``)}`);
        } else {
          console.log(`No new licenses`);
        }
      });
  });
}

function showDetails(name, versionLoose, packages) {
  const table = new Table({
    head: [
      `Package`,
      `Size`,
      `Updated`,
      `License`,
      `Dependencies`
    ]
  });
  Object.keys(packages).forEach((key) => {
    const { modified, license, size, dependencies } = packages[key];
    const dependenciesAr = [];
    Object.keys(dependencies).forEach((k) => {
      dependenciesAr.push(`${k}@${dependencies[k]}`);
    });
    table.push([
      key,
      filesize(size),
      moment(modified).fromNow(),
      getLicenseStr(license),
      dependenciesAr.join(',\n')
    ]);
  });
  // process.stdout.cursorTo(0);
  // process.stdout.clearLine(1);
  console.log(table.toString());
  process.exit(0);
}

const choices = [
  `Install`,
  `Skip`,
  `Show Impact`,
  `Show Details`
];

function promptNextAction(name, versionLoose, packages) {
  return inquirer.prompt({
    type: `list`,
    name: `next`,
    message: `Install this package?`,
    choices
  })
    .then(({ next }) => {
      switch (choices.indexOf(next)) {
        case 0:
          exec(`npm`, process.argv.slice(2));
          return Promise.reject();
        case 2:
          return showImpact(name, versionLoose, packages);
        case 3:
          return showDetails(name, versionLoose, packages);
        default:
          process.exit(0);
      }
    })
    .then(() => {
      return promptNextAction(name, versionLoose, packages);
    }, (e) => {
      if (e) {
        throw e;
      }
    });
}

function install(nameVersion) {
  const { name, versionLoose } = parseName(nameVersion);
  getPackageDetails(name, versionLoose)
    .then((packageStats) => {
      process.stdout.cursorTo(0);
      process.stdout.clearLine(1);
      process.stdout.write(`You are installing ${
        packageStats.name
      }@${
        packageStats.version
      } (last modified ${
        moment(packageStats.modified).fromNow()
      })\n`);
      return walkDependencies(
        { [name]: versionLoose }
      );
    })
    .then((packages) => {
      showQuickStats(name, versionLoose, packages);
      return promptNextAction(
        name, versionLoose, packages
      );
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

program.version(packageJson.version);
program.description(packageJson.description);

program.command(`install <name>`)
  .alias(`i`)
  .action(install)
  .option(`-S, --save`, `Save`)
  .option(`-D, --save-dev`, `Save`);

program.parse(process.argv);
