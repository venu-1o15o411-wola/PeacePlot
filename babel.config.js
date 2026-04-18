module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Must be last — required for Reanimated + Vision Camera frame processors / worklets
      "react-native-reanimated/plugin",
    ],
  };
};
