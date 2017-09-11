/**
 * @file returns licensee type
 */

const licenseTypes = require(`./licenses.json`);
const spdxSatisfies = require('spdx-satisfies');
const correct = require('spdx-correct');

function satisfies(a, b) {
  try {
    //  TODO fails at W3C-20150513
    return spdxSatisfies(a, b);
  } catch (e) {
    // console.log(a, b, e);
    //  dummy fallback
    return a === b;
  }
}

module.exports = function getLicenseType(license) {
  let type = 'uncategorized';
  const licenseCorrected = correct(license);
  if (!licenseCorrected) {
    return type;
  }
  Object.keys(licenseTypes).some((testType) => {
    return licenseTypes[testType].some((testLicense) => {
      if (
        satisfies(
          testLicense,
          licenseCorrected
        )
      ) {
        type = testType;
        return true;
      }
    });
  });
  return type;
};
