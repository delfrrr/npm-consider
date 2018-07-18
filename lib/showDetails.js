/**
 * @file print table with all dependencies
 */

const Table = require('cli-table3');
const filesize = require('filesize');
const moment = require('moment');
const formatLicenseType = require('./formatLicenseType');

/**
 * @param  {Object} packages
 */
module.exports = function showDetails(packages) {
  const table = new Table({
    head: [
      `Package`,
      `Size`,
      `Updated`,
      { content: 'License', colSpan: 2 },
      `Dependencies`
    ],
    style: { 'padding-left': 1, 'padding-right': 1 }
  });
  Object.keys(packages).forEach((key) => {
    const {
      modified, license, size, dependencies, licenseType
    } = packages[key];
    const dependenciesAr = [];
    Object.keys(dependencies).forEach((k) => {
      dependenciesAr.push(`${k}@${dependencies[k]}`);
    });
    table.push([
      key,
      filesize(size),
      moment(modified).fromNow(),
      `${
        formatLicenseType(licenseType)
          .split(' ')
          .join('\n')
      }`,
      license,
      dependenciesAr.join(',\n')
    ]);
  });
  // process.stdout.cursorTo(0);
  // process.stdout.clearLine(1);
  console.log(table.toString());
  process.exit(0);
};
