/**
 * @file print quick stats
 */

const getPackagesStats = require('./getPackagesStats');
const formatLicenseType = require('./formatLicenseType');
const filesize = require('filesize');
const getSimpleTable = require('./getSimpleTable');

/**
 * @param  {string} name
 * @param  {string} versionLoose
 * @param  {Object} packages
 */
module.exports = function showQuickStats(
  name, versionLoose, packages
) {
  const { count, size, licenseTypes } = getPackagesStats(packages);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  const table = getSimpleTable();
  table.push(
    ['Packages', count, ''],
    ['Size', filesize(size), '']
  );
  Object.keys(licenseTypes).forEach((type, k) => {
    table.push(
      [
        k === 0 ? 'Licenses' : '',
        formatLicenseType(type),
        licenseTypes[type]
      ]
    );
  });
  console.log(table.toString());
};
