/**
 * cleans a line and outputs the error
 */

const colors = require('colors/safe');
const readline = require('readline');

/**
 * @param {string} str
 */
module.exports = function printError(str) {
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 1);
  console.error(colors.red(str));
};
