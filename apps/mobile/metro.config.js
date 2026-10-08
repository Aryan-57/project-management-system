const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Expo watches the monorepo. Keep downloaded SDKs and native build outputs
// out of Metro's module graph and file watcher.
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  /[\\/]\.local-tools[\\/]/,
  /[\\/]artifacts[\\/]/,
  /[\\/]tmp[\\/]/,
  /[\\/]android[\\/](?:build|app[\\/]build|\.gradle|\.cxx)[\\/]/,
];
module.exports = config;
