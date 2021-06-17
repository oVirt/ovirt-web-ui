const babelJest = require('babel-jest')

module.exports = babelJest.createTransformer({
  babelrc: false,
  configFile: false,

  // This should match the paths.appSrc 'babel-loader' options.preset in webpack.config.dev.js
  presets: [ './config/babel.app.config.js' ],

})
