module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
  // Exclude react-native-agora specs from codegen processing
  exclude: [
    /node_modules\/react-native-agora\/src\/specs\/.*\.tsx$/,
  ],
};
