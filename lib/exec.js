/**
 * @file exec command with args
 */

const { spawn } = require('child_process');

/**
 * @param  {string} command
 * @param  {string[]} args
 */
module.exports = function exec(command, args) {
  spawn(command, args, {
    stdio: `inherit`
  });
};
