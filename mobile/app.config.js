const baseConfig = require("./app.json").expo;

module.exports = () => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    ...baseConfig,
    plugins: androidGoogleMapsApiKey
      ? [
          ...baseConfig.plugins,
          ["react-native-maps", { androidGoogleMapsApiKey }],
        ]
      : baseConfig.plugins,
  };
};
