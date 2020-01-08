/**
 * @file print quick stats
 */

const filesize = require('filesize');
const readline = require('readline');
const getPackagesStats = require('./getPackagesStats');
const formatLicenseType = require('./formatLicenseType');
const getSimpleTable = require('./getSimpleTable');

/**
 * @param  {Object} packages
 */
module.exports = function showQuickStats(packages) {
  const { count, size, licenseTypes } = getPackagesStats(packages);
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout);
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
