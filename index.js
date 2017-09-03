/**
* @file main file
*/

const program = require(`commander`);
const packageJson = require(`./package.json`);
const fetch = require(`node-fetch`);
const semver = require(`semver`);
const Queue = require(`promise-queue`);
const filesize = require(`filesize`);
const moment = require(`moment`);

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
  const url = `${registryUrl}${name.replace(`/`, `%2f`)}`;
  if (!packageDetailsCache[key]) {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    process.stdout.write(`GET ${url}`);
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
      let modified = packageInfo.time[version];
      if (!modified) {
        modified = packageInfo.time.modified;
      }
      return fetch(versionDetails.dist.tarball, { method: `HEAD` }).then((r) => {
        const size = r.headers.get(`content-length`);
        return {
          name,
          modified,
          version,
          license: versionDetails.license || `Unknown`,
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
      .then((packageStats) => {
        const { name, version, dependencies: pDependncies } = packageStats;
        packages[`${name}@${version}`] = packageStats;
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
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`Total download packages ${packagesAr.length}`);
  console.log(`Total download size ${filesize(packagesAr.reduce((size, key) => {
    size += Number(packages[key].size);
    return size;
  }, 0))}`);
  const licenses = packagesAr.reduce((l, key) => {
    let { license } = packages[key];
    if (typeof license === `object`) {
      license = license.type || `Unknown`;
    }
    l[license] = l[license] || 0;
    l[license] += 1;
    return l;
  }, {});
  console.log(`Licenses ${Object.keys(licenses).reduce((out, license) => {
    out += ` ${license}:${licenses[license]}`;
    return out;
  }, ``)}`);
}

function parseName(nameVersion) {
  let nameVersionStr = String(nameVersion).trim();
  let scope = false;
  if (nameVersionStr[0] === `@`) {
    scope = true;
    nameVersionStr = nameVersionStr.slice(1);
  }
  console.log(nameVersionStr, scope);
  let [name, semVersion] = nameVersionStr.split(`@`);
  if (!semVersion) {
    semVersion = `latest`;
  }
  if (scope) {
    name = `@${name}`;
  }
  return { name, semVersion };
}

function install(nameVersion) {
  const queue = new Queue(20, Infinity);
  const packages = {};
  const { name, semVersion } = parseName(nameVersion);
  getPackageDetails(name, semVersion).then((packageStats) => {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    process.stdout.write(`You are installing ${
      packageStats.name
    }@${
      packageStats.version
    } (last modified ${
      moment(packageStats.modified).fromNow()
    })\n`);
    return addPackageToQueue(
      queue,
      { [name]: semVersion },
      packages
    );
  }).then(() => {
    showQuickStats(name, semVersion, packages);
  });
}

program.version(packageJson.version);
program.description(packageJson.description);

program.command(`install <name>`)
  .alias(`i`)
  .action(install);

program.parse(process.argv);
