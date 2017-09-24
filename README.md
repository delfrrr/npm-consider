# npm-consider

Check npm package dependencies size, licenses and impact on your package before installing it

![npm-consider](https://i.imgur.com/eAQPbHL.gif)

## Features

* calculate package size with dependencies recursively
* show packages license policy for linking
* calculates impact on current package
* command syntax equivalent to `npm`
* analyzes packages without downloading it


## Installing

```
npm install -g npm-consider
```

## Usage

`npm-consider` has the similar options as `npm install`:

```
npm-consider install --save express
```
The command makes recursive remote `npm ls` and calculates how many packages will be downloaded and packages size. Also, collects and categorizes licenses of the dependencies:

 * `public domain` and `permissive` means that license has no `copyleft` obligations when linking
 * `restricted` means that license has restricted linked which depends on other packages licenses
 * `copyleft` means that license requires dependent module to have free license
 * `uncategorized` means that license was not detected or was not categorized in terms of linking to another package as a dependency.

### Menu options

**Install**: runs npm install with the same arguments

**Impact**: calculates dependencies for current module and compares new dependency with existing dependencies. This option behaves differently, depending on `--save` or `--save-dev` option. Second one takes into account productions and development dependencies of the current module.

**Details**: prints all dependencies and their licenses and sizes.

**Skip**: skips install, no changes in your project will apply.
