/**
* @file format license types
*/

const chalk = require('chalk');

const labels = {
  publicDomain: `Public Domain`,
  permissive: `Permissive`,
  weaklyProtective: `Weakly Protective`,
  stronglyProtective: `Strongly Protective`,
  networkProtective: `Network Protective`,
  uncategorized: `Uncategorized`
};

const colors = {
  publicDomain: `green`,
  permissive: `green`,
  weaklyProtective: `yellow`,
  stronglyProtective: `red`,
  networkProtective: `redBright`,
  uncategorized: `grey`
};

module.exports = function formatLicenseType(type) {
  return chalk[colors[type]](labels[type]);
};
