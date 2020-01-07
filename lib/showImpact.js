/**
* @file print package impact on current package
*/

const program = require('commander');
const filesize = require('filesize');
const readline = require('readline');
const getLocalPackage = require('./getLocalPackage');
const calculateImpactPackages = require('./calculateImpactPackages');
const satisfies = require('./satisfies');
const walkDependencies = require('./walkDependencies');
const getPackagesStats = require('./getPackagesStats');
const getSimpleTable = require('./getSimpleTable');

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
 * @param  {number} p
 * @return {string}
 */
function getPercents(p) {
  return `+${(p * 100).toFixed(2)}%`;
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
    if (program.args[1].saveDev) {
      allDependencies = { ...dependencies, ...devDependencies };
    } else {
      allDependencies = { ...dependencies };
    }
    if (Object.keys(allDependencies).length === 0) {
      console.log('Local package has no dependencies');
      return;
    }
    return walkDependencies(allDependencies)
      .then((currentPackages) => {
        const impactPackages = calculateImpactPackages(
          newPackages, currentPackages
        );
        const currentPackagesStats = getPackagesStats(currentPackages);
        const impactPackagesStats = getPackagesStats(impactPackages);
        const newLicenses = calculateNewLicenses(
          impactPackagesStats.licenses,
          currentPackagesStats.licenses
        );

        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout);

        const table = getSimpleTable();
        table.push([
          'Packages',
          impactPackagesStats.count,
          getPercents(impactPackagesStats.count / currentPackagesStats.count)
        ]);
        table.push([
          'Size',
          filesize(impactPackagesStats.size),
          getPercents(impactPackagesStats.size / currentPackagesStats.size)
        ]);
        if (Object.keys(newLicenses).length) {
          Object.keys(newLicenses).forEach((license, k) => {
            table.push([
              k === 0 ? 'Licenses' : '',
              license,
              newLicenses[license]
            ]);
          });
        } else {
          table.push([{
            content: 'No new licenses',
            colSpan: 3
          }]);
        }
        console.log(table.toString());
      });
  });
};
