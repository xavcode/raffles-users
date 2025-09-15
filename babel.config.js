module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'], // Explicitly set root for module resolution
                    alias: {
                        // This maps @/ to the root of your project
                        // e.g., @/app/components/SocialButton resolves to ./app/components/SocialButton
                        '@': './',
                    },
                },
            ],
            "react-native-reanimated/plugin",
        ],
    };
};