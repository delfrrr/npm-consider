/**
 * @file detects if package initialised with yarn
 */

const findPrefixPromise = require('./findPrefixPromise');
const fs = require('fs');
const path = require('path');

module.exports = function testYarn() {
  return findPrefixPromise().then((packagePath) => {
    return fs.existsSync(
      path.join(packagePath, 'yarn.lock')
    );
  });
};
