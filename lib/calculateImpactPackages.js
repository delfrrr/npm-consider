/**
 * @file calculate packages which are not installed yet considering tree flattering
 */

/**
 * @param  {object} packages
 * @return {string[]} packages at first level of tree
 */
function flatingPackages(packages) {
  return Object.keys(packages).reduce((
    flatPackages, newKey
  ) => {
    const newName = packages[newKey].name;
    let duplicated = false;
    for (let i = 0; i < flatPackages.length; i += 1) {
      const key = flatPackages[i];
      const { name } = packages[key];
      if (name === newName) {
        duplicated = true;
        break;
      }
    }
    if (!duplicated) {
      flatPackages.push(newKey);
    }
    return flatPackages;
  }, []);
}

/**
 * @param  {object} newPackages
 * @param  {object} currentPackages
 * @return {object}
 */
module.exports = function calculateImpactPackages(
  newPackages, currentPackages
) {
  const flatCurrentPackages = flatingPackages(currentPackages);
  return Object.keys(newPackages).filter((key) => {
    return !flatCurrentPackages.includes(key);
  }).reduce((impactPackages, key) => {
    impactPackages[key] = newPackages[key];
    return impactPackages;
  }, {});
};
