/**
* @file print package impact on current package
*/

const program = require('commander');
const getLocalPackage = require('./getLocalPackage');
const calculateImpactPackages = require('./calculateImpactPackages');
const satisfies = require('./satisfies');
const walkDependencies = require('./walkDependencies');
const getPackagesStats = require('./getPackagesStats');
const filesize = require('filesize');

/**
 * @param  {Object} impactLicenses  license -> count
 * @param  {Object} currentLicenses license -> count
 * @return {Object} license -> count
 */
function calculateNewLicenses(
  impactLicenses, currentLicenses
) {
  return Object.keys(impactLicenses).filter((
    newLicense
  ) => {
    return !Object.keys(
      currentLicenses
    ).some(
      (existingLicense) => {
        return satisfies(newLicense, existingLicense);
      }
    );
  }).reduce((newLicenses, license, k, licenses) => {
    const matchingL = licenses.filter(
      (otherLicense) => {
        return satisfies(otherLicense, license);
      }
    ).sort((l1, l2) => l2.length - l1.length);
    newLicenses[matchingL[0]] = matchingL.reduce(
      (count, l) => {
        count += impactLicenses[l];
        return count;
      }, 0
    );
    return newLicenses;
  }, {});
}

/**
 * @param  {string} name
 * @param  {string} versionLoose
 * @param  {object} newPackages
 */
module.exports = function showImpact(
  name, versionLoose, newPackages
) {
  return getLocalPackage().then((localPackage) => {
    const dependencies = localPackage.dependencies || {};
    const devDependencies = localPackage.devDependencies || {};
    let allDependencies;
    if (program['save-dev']) {
      allDependencies = Object.assign({}, dependencies, devDependencies);
    } else {
      allDependencies = Object.assign({}, dependencies);
    }
    return walkDependencies(allDependencies)
      .then((currentPackages) => {
        const impactPackages = calculateImpactPackages(
          newPackages, currentPackages
        );
        const currentPackagesStats = getPackagesStats(currentPackages);
        const impactPackagesStats = getPackagesStats(impactPackages);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(`Packages ${impactPackagesStats.count} (+${
          (impactPackagesStats.count / currentPackagesStats.count * 100).toFixed(2)
        }%)`);
        console.log(`Size ${filesize(impactPackagesStats.size)} (+${
          (impactPackagesStats.size / currentPackagesStats.size * 100).toFixed(2)
        }%)`);
        const newLicenses = calculateNewLicenses(
          impactPackagesStats.licenses,
          currentPackagesStats.licenses
        );
        if (Object.keys(newLicenses).length) {
          console.log(`Licenses ${
            Object.keys(newLicenses).reduce((out, license) => {
              out += ` ${license} (${newLicenses[license]})`;
              return out;
            }, ``)
          }`);
        } else {
          console.log(`No new licenses`);
        }
      });
  });
};
