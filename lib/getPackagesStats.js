/**
 * @file calculate packages aggregated stats
 */

const getLicenseStr = require('./getLicenseStr');
const getLicenseType = require('./getLicenseType');

module.exports = function getPackagesStats(packages) {
  const packagesAr = Object.keys(packages);
  const count = packagesAr.length;
  const size = packagesAr.reduce((s, key) => {
    s += Number(packages[key].size);
    return s;
  }, 0);
  const licenses = packagesAr.reduce((l, key) => {
    const license = getLicenseStr(packages[key].license);
    l[license] = l[license] || 0;
    l[license] += 1;
    return l;
  }, {});
  const licenseTypes = {};
  Object.keys(licenses).forEach((license) => {
    const type = getLicenseType(license);
    if (!(type in licenseTypes)) {
      licenseTypes[type] = 0;
    }
    licenseTypes[type] += licenses[license];
  });
  return {
    count, size, licenses, licenseTypes
  };
};
