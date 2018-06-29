/**
 * @file fetches package details from registry
 */

const fetch = require('node-fetch');
const semver = require('semver');
const getLicenseStr = require('./getLicenseStr');
const getLicenseType = require('./getLicenseType');
const url = require('url');
const colors = require('colors/safe');
const readline = require('readline');

const packageDetailsCache = {};
const npmConfig = require('rc')('npm', {
  registry: `https://registry.npmjs.org/`
});

/**
 * @param  {Response} r
 * @return {Promise}
 */
function checkResponse(r) {
  if (r.ok) {
    return r.json();
  }
  throw new Error(`Response is not ok`);
}

/**
 * finds biggest matching version
 * @param  {string} versionLoose
 * @param  {string[]} versions
 * @return {string}
 */
function getVersion(versionLoose, versions) {
  let version;
  for (let i = 0; i < versions.length; i += 1) {
    let matchingVersion;
    if (semver.satisfies(versions[i], versionLoose)) {
      matchingVersion = versions[i];
    }
    if (matchingVersion) {
      if (!version) {
        version = matchingVersion;
      } else if (semver.gt(matchingVersion, version)) {
        version = matchingVersion;
      }
    }
  }
  return version;
}

/**
 * @param  {string} name         package name
 * @param  {string} versionLoose version selector
 * @return {Promise}
 */
module.exports = function getPackageDetails(
  name,
  versionLoose
) {
  const versionUrlObj = url.parse(versionLoose);
  if (versionUrlObj.protocol) {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 1);
    console.error(
      colors.red(`${
        versionUrlObj.protocol.replace(':', '')
      } is not supported by npm-consider, skipping ${
        versionLoose
      }`));
    return Promise.resolve(null);
  }
  const key = `${name}@${versionLoose}`;
  const scope = name[0] === '@' ? name.slice(0, name.indexOf('/')) : undefined;
  let registryUrl = (scope && npmConfig[`${scope}:registry`]) || npmConfig.registry;
  if (registryUrl.charAt(registryUrl.length - 1) !== `/`) {
    registryUrl += `/`;
  }
  const infoUrl = `${registryUrl}${name.replace(`/`, `%2f`)}`;
  if (!packageDetailsCache[key]) {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 1);
    process.stdout.write(`GET ${infoUrl}`);
    packageDetailsCache[key] = fetch(infoUrl).then(checkResponse).then((packageInfo) => {
      let version;
      if (!versionLoose) {
        version = packageInfo[`dist-tags`].latest;
      } else if (packageInfo[`dist-tags`][versionLoose]) {
        version = packageInfo[`dist-tags`][versionLoose];
      } else if (packageInfo.versions[versionLoose]) {
        version = versionLoose;
      } else {
        version = getVersion(versionLoose, Object.keys(packageInfo.versions));
      }
      let versionDetails = packageInfo.versions[version];
      if (!versionDetails) {
        versionDetails = packageInfo.versions[packageInfo[`dist-tags`].latest];
      }
      let modified;
      if (packageInfo.time) {
        modified = packageInfo.time[version];
        if (!modified) {
          modified = packageInfo.time.modified;
        }
      }
      return fetch(versionDetails.dist.tarball, { method: `HEAD` }).then((r) => {
        const size = r.headers.get(`content-length`);
        const license = getLicenseStr(
          versionDetails.license || versionDetails.licenses || `Unknown`
        );
        const licenseType = getLicenseType(license);
        return {
          name,
          modified,
          version,
          license,
          licenseType,
          dependencies: versionDetails.dependencies || {},
          versionLoose,
          size
        };
      });
    });
  }
  return packageDetailsCache[key];
};
