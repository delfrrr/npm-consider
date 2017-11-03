/**
 * @file checks if need to run in prod mode
 */

const program = require('commander');

module.exports = function isProduction() {
  const [, options] = program.args;
  const { production } = options;
  const { NODE_ENV } = process.env;
  return production || NODE_ENV === 'production';
};
