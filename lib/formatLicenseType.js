/**
* @file format license types
*/

const colors = require('colors/safe');

const labels = {
  publicDomain: `Public Domain`,
  permissive: `Permissive`,
  limited: `Limited`,
  copyleft: `Copyleft`,
  uncategorized: `Uncategorized`
};

const palette = {
  publicDomain: `green`,
  permissive: `green`,
  limited: `yellow`,
  copyleft: `magenta`,
  uncategorized: `grey`
};

module.exports = function formatLicenseType(type) {
  return colors[palette[type]](labels[type]);
};
