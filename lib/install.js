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
const showDetails = require('./showDetails');
const isProduction = require('./isProduction');

/**
 * @return {Promise}
 */
function promptAction(packages) {
  return getInstallCommand().then(({ command, args }) => {
    const choices = [
      `Install (${
        colors.bold(`${
          command
        }${
          args.length ? ' ' : ''
        }${
          args.join(` `)
        }`)
      })`,
      `Details`,
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
        case 1:
          return showDetails(packages);
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
      // TODO: dev and prod may have different versions of same dependency
      Object.assign(
        allDependencies,
        dependencies || {}
      );
      if (!isProduction()) {
        Object.assign(
          allDependencies,
          devDependencies || {}
        );
      }
      return walkDependencies(allDependencies);
    })
    .then((packages) => {
      showQuickStats(packages);
      return promptAction(packages);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
};
