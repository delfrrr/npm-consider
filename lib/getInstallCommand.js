/**
 * @file get install command considering package manager and arguments
 */

const program = require('commander');
const testYarn = require('./testYarn');
const isProduction = require('./isProduction');

/**
 * @return {Promise.<{command: string, args: string[]}>}
 */
module.exports = function getInstallCommand() {
  return testYarn().then((isYarn) => {
    const command = isYarn ? `yarn` : `npm`;
    const args = [];
    if (command === 'npm') {
      args.push(...process.argv.slice(2));
    } else {
      // yarn
      const [nameVersion, options] = program.args;
      if (nameVersion) {
        args.push('add', nameVersion);
        if (options.saveDev) {
          args.push('--dev');
        }
      } else {
        args.push('install');
        if (isProduction()) {
          args.push('--production');
        }
      }
    }
    return { command, args };
  });
};
