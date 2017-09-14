/**
* @file format license types
*/

const colors = require('colors/safe');

const labels = {
  publicDomain: `Public Domain`,
  permissive: `Permissive`,
  weaklyProtective: `Weakly Protective`,
  stronglyProtective: `Strongly Protective`,
  networkProtective: `Network Protective`,
  uncategorized: `Uncategorized`
};

const palette = {
  publicDomain: `green`,
  permissive: `green`,
  weaklyProtective: `yellow`,
  stronglyProtective: `red`,
  networkProtective: `magenta`,
  uncategorized: `grey`
};

module.exports = function formatLicenseType(type) {
  return colors[palette[type]](labels[type]);
};
