/**
 * @file detects if package initialised with yarn
 */

const fs = require('fs');
const path = require('path');
const findPrefixPromise = require('./findPrefixPromise');

module.exports = function testYarn() {
  return findPrefixPromise().then((packagePath) => {
    return fs.existsSync(
      path.join(packagePath, 'yarn.lock')
    );
  });
};
