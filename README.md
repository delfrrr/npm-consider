# npm-consider

Check npm package dependencies size, licenses and impact on your package before installing it 🤔

![npm-consider](https://i.imgur.com/eAQPbHL.gif)
If you like it, please, ⭐️ this repo!
## Features

* calculate dependencies size recursively
* show dependencies license policy for linking
* calculates impact on current package
* show full dependency graph
* analyzes packages without downloading it


## Installing

```
npm install -g npm-consider
```
**Note:** this tool is more useful when you colleagues also use it 😉
## Usage

`npm-consider` has the same arguments as `npm install`:

```
npm-consider install --save express
```
The command recursively requests packages info from npm and builds dependencies graph. Size of the package determined via `HEAD` request to `tarball` download URL.

### Licence type

`npm-consider` calculates license type for every dependency. The type defines license policy for [linking as a librtary](https://en.wikipedia.org/wiki/Library_(computing)#Linking). Data collected from [Comparison of free and open-source software licenses](https://en.wikipedia.org/wiki/Comparison_of_free_and_open-source_software_licenses) on Wikipedia.

 * `public domain` and `permissive` license allows you to use dependency with most popular open source licenses and for proprietary software
 * `restricted` dependency license can be combined only with some specific licenses
 * `copyleft` or *protective* dependency license requires dependent module to have a free license, which prevents it from being proprietary
 * `uncategorized` means that license was not found in a package info or was not categorized in terms of linking.

**Note:** that even permissive licenses have some restrictions. Check the following slide and article to learn about license compatibility:

![](https://www.dwheeler.com/essays/floss-license-slide-image.png)
[The Free-Libre / Open Source Software (FLOSS) License Slide](https://www.dwheeler.com/essays/floss-license-slide.html)

### Menu options


* **Install** runs `npm install` with the same arguments
* **Impact** takes onto account already installed dependencies and shows relative impact. It behaves differently, depending on `--save` or `--save-dev` option. The second one takes into account already installed `dependencies` and `devDpenedencies`.
* **Details** prints dependencies graph
* **Skip** cancels `npm install`; no changes in your project will apply.
