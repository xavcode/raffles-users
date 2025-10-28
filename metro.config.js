const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Module resolution should work normally for components
// No blockList needed as components are not routes

module.exports = withNativeWind(config, { input: './app/global.css' });