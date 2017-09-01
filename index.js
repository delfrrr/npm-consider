/**
* @file main file
*/

const program = require(`commander`);
const packageJson = require(`./package.json`);
const fetch = require(`node-fetch`);
const semver = require(`semver`);
const Queue = require(`promise-queue`);
const filesize = require(`filesize`);
const moment = require('moment');

const registryUrl = `https://registry.npmjs.org/`;

function checkResponse(r) {
  if (r.ok) {
    return r.json();
  }
  throw new Error(`Response is not ok`);
}

function getVersion(semVersion, versions) {
  let version;
  for (let i = 0; i < versions.length; i += 1) {
    let matchingVersion;
    if (semver.satisfies(versions[i], semVersion)) {
      matchingVersion = versions[i];
    }
    if (matchingVersion) {
      if (!version) {
        version = matchingVersion;
      } else if (semver.gt(version, matchingVersion)) {
        version = matchingVersion;
      }
    }
  }
  return version;
}

const packageDetailsCache = {};

function getPackageDetails(name, semVersion) {
  const key = `${name}@${semVersion}`;
  const url = `${registryUrl}${name}`;
  if (!packageDetailsCache[key]) {
    process.stdout.clearLine();
    process.stdout.write(`\r GET ${url}`);
    packageDetailsCache[key] = fetch(url).then(checkResponse).then((packageInfo) => {
      let version;
      if (!semVersion) {
        version = packageInfo[`dist-tags`].latest;
      } else if (packageInfo[`dist-tags`][semVersion]) {
        version = packageInfo[`dist-tags`][semVersion];
      } else if (packageInfo.versions[semVersion]) {
        version = semVersion;
      } else {
        version = getVersion(semVersion, Object.keys(packageInfo.versions));
      }
      let versionDetails = packageInfo.versions[version];
      if (!versionDetails) {
        versionDetails = packageInfo.versions[packageInfo[`dist-tags`].latest];
      }
      return fetch(versionDetails.dist.tarball, { method: `HEAD` }).then((r) => {
        const size = r.headers.get(`content-length`);
        return {
          name,
          modified: packageInfo.time.modified,
          version,
          license: versionDetails.license,
          dependencies: versionDetails.dependencies,
          semVersion,
          size
        };
      });
    });
  }
  return packageDetailsCache[key];
}

function createPromise() {
  let resolve;
  const p = new Promise((r) => {
    resolve = r;
  });
  p.resolve = resolve;
  return p;
}

function addPackageToQueue(
  queue,
  dependencies = {},
  packages,
  p = createPromise()
) {
  Object.keys(dependencies).forEach((pName) => {
    const semVersion = dependencies[pName];
    queue.add(() => getPackageDetails(pName, semVersion)
      .then((packageData) => {
        const { name, version, dependencies: pDependncies } = packageData;
        packages[`${name}@${version}`] = packageData;
        addPackageToQueue(
          queue,
          pDependncies,
          packages,
          p
        );
      }))
      .then(() => {
        if (queue.getPendingLength() === 0) {
          p.resolve();
        }
      });
  });
  return p;
}

function showQuickStats(name, semVersion, packages) {
  const packagesAr = Object.keys(packages);
  const resolvedPackageName = packagesAr.filter((key) => {
    return packages[key].name === name;
  })[0];
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`You are installing ${resolvedPackageName} (last modified ${
    moment(packages[resolvedPackageName].modified).fromNow()
  })`);
  console.log(`Package size ${filesize(packages[resolvedPackageName].size)}`);
  console.log(`Total number of packages to be installed ${packagesAr.length}`);
  console.log(`Total size ${filesize(packagesAr.reduce((size, key) => {
    size += Number(packages[key].size);
    return size;
  }, 0))}`);
}

function install(nameVersion) {
  const queue = new Queue(20, Infinity);
  const packages = {};
  const [name, semVersion] = nameVersion.split(`@`);
  addPackageToQueue(
    queue,
    { [name]: semVersion || `latest` },
    packages
  ).then(() => {
    showQuickStats(name, semVersion, packages);
  });
}

program.version(packageJson.version);
program.description(packageJson.description);

program.command(`install <name>`)
  .alias(`i`)
  .action(install);

program.parse(process.argv);
