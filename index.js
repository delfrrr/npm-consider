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
// const getLocalPackage = require('./lib/getLocalPackage');

function showQuickStats(name, versionLoose, packages) {
  const packagesAr = Object.keys(packages);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`Total download packages ${packagesAr.length}`);
  console.log(`Total download size ${filesize(packagesAr.reduce((size, key) => {
    size += Number(packages[key].size);
    return size;
  }, 0))}`);
  const licenses = packagesAr.reduce((l, key) => {
    let { license } = packages[key];
    if (typeof license === `object`) {
      license = license.type || `Unknown`;
    }
    l[license] = l[license] || 0;
    l[license] += 1;
    return l;
  }, {});
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

const choices = [`Install`, `Skip`, `Show impact`];

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
      return inquirer.prompt({
        type: `list`,
        name: `next`,
        message: `Install this package?`,
        choices
      });
    })
    .then(({ next }) => {
      switch (choices.indexOf(next)) {
        case 0:
          return exec(`npm`, process.argv.slice(2));
        case 2:
          console.log(`show impact`);
          break;
        default:
          process.exit(0);
      }
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
  .action(install);

program.parse(process.argv);
