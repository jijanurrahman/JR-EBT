const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block macOS AppleDouble resource fork files (._*) on external or network drives
const appleDoubleRegex = /[\\/]\._[^/]*$/;

const existingBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
    ? [config.resolver.blockList]
    : [];

config.resolver.blockList = [...existingBlockList, appleDoubleRegex];

module.exports = config;

