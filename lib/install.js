/**
 * @file install action
 */
const getLocalPackage = require('./getLocalPackage');
const colors = require('colors/safe');
const walkDependencies = require('./walkDependencies');
const showQuickStats = require('./showQuickStats');
const getInstallCommand = require('./getInstallCommand');
const inquirer = require('inquirer');
const exec = require('./exec');

/**
 * @return {Promise}
 */
function promptAction() {
  return getInstallCommand().then(({ command, args }) => {
    const choices = [
      `Install (${
        colors.bold(`${command} ${args.join(` `)}`)
      })`,
      `Skip`
    ];
    return inquirer.prompt({
      type: `list`,
      name: `next`,
      message: `What is next?`,
      choices
    }).then(({ next }) => {
      switch (choices.indexOf(next)) {
        case 0:
          exec(command, args);
          return Promise.reject();
        default:
          process.exit(0);
      }
    }).catch((e) => {
      if (e) {
        throw e;
      }
    });
  });
}

module.exports = function install() {
  getLocalPackage()
    .then((localPackage) => {
      const {
        name, version, dependencies, devDependencies
      } = localPackage;
      console.log(colors.bold(
        `${name}@${version}`
      ));
      const allDependencies = {};
      Object.assign(
        allDependencies,
        dependencies || {},
        devDependencies || {}
      );
      return walkDependencies(allDependencies);
    })
    .then((packages) => {
      showQuickStats(packages);
      return promptAction();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
};
