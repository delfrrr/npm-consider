/**
 * @file collect recursively all dependencies
 */

const Queue = require('promise-queue');
const getPackageDetails = require('./getPackageDetails');
const printError = require('./printError');

/**
 * recursive walk
 * @param  {Object} dependencies
 * @param  {Object} packages
 * @param  {Queue} queue
 * @param  {function} resolve
 */
function walk(
  dependencies, packages, queue, resolve
) {
  Object.keys(dependencies || {}).forEach((pName) => {
    const versionLoose = dependencies[pName];
    queue.add(() => getPackageDetails(pName, versionLoose)
      .then((packageStats) => {
        if (!packageStats) {
          return;
        }
        const {
          name, version, dependencies: pDependencies
        } = packageStats;
        const nameVersion = `${name}@${version}`;
        // deal with circular deps
        if (!packages[nameVersion]) {
          packages[nameVersion] = packageStats;
          walk(
            pDependencies,
            packages,
            queue,
            resolve
          );
        }
      }))
      .then(() => {
        if (queue.getPendingLength() === 0) {
          resolve(packages);
        }
      })
      .catch((e) => {
        printError(e);
        process.exit(1);
      });
  });
}

/**
 * @param  {Object} dependencies package.json format
 * @return {Promise.<Object>} resolved dependencies
 */
module.exports = function walkDependencies(dependencies) {
  const packages = {};
  const queue = new Queue(20, Infinity);
  return new Promise((resolve) => {
    walk(dependencies, packages, queue, resolve);
  });
};
