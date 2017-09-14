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
const getPackagesStats = require('./lib/getPackagesStats');
const Table = require('cli-table2');
const formatLicenseType = require('./lib/formatLicenseType');
const showImpact = require('./lib/showImpact');

function showQuickStats(name, versionLoose, packages) {
  const { count, size, licenseTypes } = getPackagesStats(packages);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`Total download packages ${count}`);
  console.log(`Total download size ${filesize(size)}`);
  console.log(`Licenses ${Object.keys(licenseTypes)
    .reduce((out, type) => {
      out += ` ${formatLicenseType(type)} (${licenseTypes[type]})`;
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

function showDetails(name, versionLoose, packages) {
  const table = new Table({
    head: [
      `Package`,
      `Size`,
      `Updated`,
      { content: 'License', colSpan: 2 },
      `Dependencies`
    ],
    style: { 'padding-left': 1, 'padding-right': 1 }
  });
  Object.keys(packages).forEach((key) => {
    const {
      modified, license, size, dependencies, licenseType
    } = packages[key];
    const dependenciesAr = [];
    Object.keys(dependencies).forEach((k) => {
      dependenciesAr.push(`${k}@${dependencies[k]}`);
    });
    table.push([
      key,
      filesize(size),
      moment(modified).fromNow(),
      `${
        formatLicenseType(licenseType)
          .split(' ')
          .join('\n')
      }`,
      license,
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
  `Impact`,
  `Details`,
  `Skip`
];

function promptNextAction(name, versionLoose, packages) {
  return inquirer.prompt({
    type: `list`,
    name: `next`,
    message: `What is next?`,
    choices
  })
    .then(({ next }) => {
      switch (choices.indexOf(next)) {
        case 0:
          exec(`npm`, process.argv.slice(2));
          return Promise.reject();
        case 1:
          return showImpact(name, versionLoose, packages);
        case 2:
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
      process.stdout.write(`${
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
