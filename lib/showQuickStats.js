/**
 * @file print quick stats
 */

const getPackagesStats = require('./getPackagesStats');
const formatLicenseType = require('./formatLicenseType');
const filesize = require('filesize');
const Table = require('cli-table2');

const chars = {
  top: '',
  'top-mid': '',
  'top-left': '',
  'top-right': '',
  bottom: '',
  'bottom-mid': '',
  'bottom-left': '',
  'bottom-right': '',
  left: '',
  'left-mid': '',
  mid: '',
  'mid-mid': '',
  right: '',
  'right-mid': '',
  middle: ' '
};

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
  const table = new Table({
    chars,
    style: { 'padding-left': 0, 'padding-right': 1 }
  });
  table.push(
    ['Packages', count, ''],
    ['Size', filesize(size), '']
    // ['Licenses', Object.keys(licenseTypes)
    //   .reduce((out, type) => {
    //     out += `${formatLicenseType(type)} (${licenseTypes[type]})`;
    //     return out;
    //   }, ``)]
  );
  // table.push([colors.bold('Licenses'), '']);
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
  // console.log('Licenses');
  // console.log(`Total download packages ${count}`);
  // console.log(`Total download size ${filesize(size)}`);
  // console.log(`Licenses ${Object.keys(licenseTypes)
  //   .reduce((out, type) => {
  //     out += ` ${formatLicenseType(type)} (${licenseTypes[type]})`;
  //     return out;
  //   }, ``)}`);
};
