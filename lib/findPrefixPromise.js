/**
 * @file find root folder of local package
 */

const findPrefix = require('./findPrefix');

module.exports = function findPrefixPromise() {
  return new Promise((resolve, reject) => {
    findPrefix(process.cwd(), (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};
