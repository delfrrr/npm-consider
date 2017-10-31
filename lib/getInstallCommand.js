/**
 * @file get install command considering package manager and arguments
 */

const testYarn = require('./testYarn');
const program = require('commander');

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
      }
    }
    return { command, args };
  });
};
