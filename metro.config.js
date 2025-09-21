const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add a block list to exclude the components directory from Expo Router's route scanning
config.resolver = {
    ...(config.resolver || {}),
    blockList: [
        // Prevents Expo Router from creating an API route for the components directory
        /\/app\/components\/.*/,
    ],
};

module.exports = withNativeWind(config, { input: './app/global.css' });