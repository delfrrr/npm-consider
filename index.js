/**
* @file main file
*/

const program = require('commander');
const packageJson = require('./package.json');
const moment = require('moment');
const inquirer = require('inquirer');
const spawn = require('child_process').spawn;
const getPackageDetails = require('./lib/getPackageDetails');
const walkDependencies = require('./lib/walkDependencies');
const showImpact = require('./lib/showImpact');
const showDetails = require('./lib/showDetails');
const showQuickStats = require('./lib/showQuickStats');
const colors = require('colors/safe');

/**
 * @param  {string} nameVersion
 * @return {object} name and version loose
 */
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

/**
 * exec command
 * @param  {string} command
 * @param  {array} args   description]
 */
function exec(command, args) {
  spawn(command, args, {
    stdio: `inherit`
  });
}

const choices = [
  `Install`,
  `Impact`,
  `Details`,
  `Skip`
];

/**
 * @param  {string} name
 * @param  {string} versionLoose
 * @param  {Object} packages
 */
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

/**
 * install action
 * @param  {string} nameVersion package considering to install
 */
function install(nameVersion) {
  const { name, versionLoose } = parseName(nameVersion);
  getPackageDetails(name, versionLoose)
    .then((packageStats) => {
      process.stdout.cursorTo(0);
      process.stdout.clearLine(1);
      process.stdout.write(`${
        colors.bold(
          `${packageStats.name}@${packageStats.version}`
        )
      } (updated ${
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
program.usage('npm-consider install <pkg>');

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.command(`install <pkg>`)
  .alias(`i`)
  .action(install)
  .option(`-S, --save`, `Save to dependencies`)
  .option(`-D, --save-dev`, `Save to devDependencies`);

program.parse(process.argv);
