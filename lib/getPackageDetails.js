/**
 * @file fetches package details from registry
 */

const fetch = require('node-fetch');
const semver = require('semver');
const url = require('url');
const readline = require('readline');
const rc = require('rc');
const getLicenseStr = require('./getLicenseStr');
const getLicenseType = require('./getLicenseType');
const printError = require('./printError');

const packageDetailsCache = {};
const npmConfig = rc('npm', {
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
  throw new Error(`Response is not ok  ${r.status} ${r.statusText} ${r.url}`);
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

const gitHubApiUrl = 'https://api.github.com/';

/**
 * @param {string} owner
 * @param {string} repo
 * @returns {Object} details
 * @returns {String} details.license
 * @returns {Number} details.size
 * @returns {String} details.modified
 */
function getSizeAndLicenseFromGitHub(owner, repo) {
  const repoInfoUrl = `${gitHubApiUrl}repos/${owner}/${repo}`;// I believe size of downloaded repo will not depend on ref
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 1);
  process.stdout.write(`GET ${repoInfoUrl}`);
  return fetch(repoInfoUrl).then(checkResponse).then(({
    size: sizeKb,
    license: licenseObj,
    updated_at: modified
  }) => {
    const size = sizeKb * 1024;
    const license = licenseObj && licenseObj.spdx_id || 'Unknown';
    return { size, license, modified };
  });
}

/**
 * @see https://developer.github.com/v3/repos/contents/
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref
 * @returns {object} dependencies, name, version
 */
function getPackageJsonFromGitHub(owner, repo, ref) {
  const packageJsonUrl = `${gitHubApiUrl}repos/${owner}/${repo}/contents/package.json?ref=${ref}`;
  readline.cursorTo(process.stdout, 0);
  readline.clearLine(process.stdout, 1);
  process.stdout.write(`GET ${packageJsonUrl}`);
  return fetch(packageJsonUrl).then(checkResponse).then(({ download_url: downloadUrl }) => {
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 1);
    process.stdout.write(`GET ${downloadUrl}`);
    return fetch(downloadUrl).then(checkResponse);
  }).then((packageJson) => {
    const dependencies = packageJson.dependencies || {};
    const { name, version } = packageJson;
    return { dependencies, name, version };
  }, (e) => {
    printError(`Cannot fetch package.json from GitHub for ${owner}/${repo}`);
    throw e;
  });
}

/**
 * @param {object} urlObj
 * @param {string} versionLoose
 * @returns {object} details like dependencies, version, size, license, modified
 */
function getPackageDetailsFromGitHub({
  host, path, hash, protocol
}, versionLoose) {
  let owner;
  let repo;
  if (protocol === 'github:') {
    owner = host;
    repo = path.slice(1);
  } else {
    [owner, repo] = String(path).slice(1).replace(/\.git$/, '').split('/');
  }
  if (!owner || !repo) {
    throw new Error(`Cannot parse github dependency url ${versionLoose}`);
  }
  let ref = 'master';
  if (hash && hash.slice(1)) {
    ref = hash.slice(1);
  }
  return Promise.all([
    getSizeAndLicenseFromGitHub(owner, repo),
    getPackageJsonFromGitHub(owner, repo, ref)
  ]).then((detailsAr) => {
    return Object.assign({}, ...detailsAr);
  });
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
    if (versionUrlObj.host === 'github.com' || versionUrlObj.protocol === 'github:') {
      // TODO: cache result
      return getPackageDetailsFromGitHub(versionUrlObj, versionLoose).then(({
        dependencies, version, size, license, modified
      }) => {
        return {
          name,
          modified,
          version,
          license,
          licenseType: getLicenseType(license),
          dependencies,
          versionLoose,
          size
        };
      }, (e) => {
        printError(e);
        return Promise.resolve(null);
      });
    }
    printError(`${
      versionUrlObj.protocol
    } is not supported by npm-consider, skipping ${
      versionLoose
    }`);
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
