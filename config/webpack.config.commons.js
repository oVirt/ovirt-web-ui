var process = require('process')
var paths = require('./paths')

var FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin');

/**
 * Disable Flow type checker in unsupported environments.
 *
 * The condition `environmentSupportedByFlowBin` comes from `flow-bin` npm package. It can't be reliably reused because
 * of poor design of FlowBabelWebpackPlugin that has `flow-bin` as its own dependency.
 *
 * @param webpackConfig webpack configuration object
 */
exports.addFlowBabelWebpackPlugin = function (webpackConfig) {
  const environmentSupportedByFlowBin = process.platform === 'darwin'
    || (process.platform === 'linux' && process.arch === 'x64')
    || (process.platform === 'win32' &&  process.arch === 'x64')
  if (environmentSupportedByFlowBin) {
    webpackConfig.plugins.push(new FlowBabelWebpackPlugin())
    return
  }
  console.warn(`Current environment (platform=${process.platform}, architecture=${process.arch}) is not supported by Flow type checker. Flow types will not be checked.`)
}

exports.commonAliases = function () {
  return {
    'ovirtapi': `${paths.appSrc}/ovirtapi/index.js`,
    'app-utils': `${paths.appSrc}/utils/index.js`,
    'app-intl': `${paths.appSrc}/intl/index.js`,
    'app-reducers': `${paths.appSrc}/reducers`,
    'app-actions': `${paths.appSrc}/actions/index.js`,
    'app-helpers': `${paths.appSrc}/helpers.js`,
    'app-constants': `${paths.appSrc}/constants/index.js`
  }
}
