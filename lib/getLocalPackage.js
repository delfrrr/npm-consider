/**
 * @file get local package.json
 */

const findPrefix = require('./findPrefix');
const fs = require('fs');
const path = require('path');

function findPackagePromise() {
  return new Promise((resolve, reject) => {
    findPrefix(process.cwd(), (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

module.exports = function getLocalPackage() {
  return findPackagePromise().then((packagePath) => {
    return JSON.parse(
      fs.readFileSync(
        path.join(packagePath, 'package.json'), 'utf8'
      )
    );
  });
};
