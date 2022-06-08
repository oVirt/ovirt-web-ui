const tty = require('tty')
const util = require('util')
const paths = require('./paths.cjs')

/*
 * The preset for ovirt-web-ui is based on the `babel-preset-react-app` package. We
 * don't need everything that is done there, and we want to have specific control over
 * what is chosen in test, dev, and prod builds.
 *
 * See: https://github.com/facebook/create-react-app/blob/master/packages/babel-preset-react-app
 */
module.exports = function (api, opts = {}) {
  api.cache(true)

  const env = process.env.BABEL_ENV || process.env.NODE_ENV
  const verbose = process.env.V === '1'
  const isEnvDevelopment = env === 'development'
  const isEnvProduction = env === 'production'
  const isEnvTest = env === 'test' // for jest running tests on nodejs

  const babelConfig = {
    presets: [
      // Polyfills necessary for user's node version (test environment)
      isEnvTest && [
        '@babel/preset-env',
        { targets: { node: 'current' } },
      ],

      // Polyfills necessary for the browserslist browsers (dev or prod environment)
      (isEnvDevelopment || isEnvProduction) && [
        '@babel/preset-env',
        {
          debug: verbose,
          useBuiltIns: 'usage',
          corejs: '3.19.1',
          exclude: ['transform-typeof-symbol'],
        },
      ],

      // Handle react JSX
      [
        '@babel/preset-react',
        {
          development: isEnvDevelopment || isEnvTest,
          runtime: 'automatic',
          useBuiltIns: true,
          useSpread: true,
        },
      ],

      // Handle flow syntax
      [
        '@babel/preset-flow',
      ],

    ].filter(Boolean),
    plugins: isEnvDevelopment ? ['react-refresh/babel', paths.appFancyConsole] : [],
  }

  if (verbose) {
    const colors = tty.isatty(1)
    console.log(`${env} babel.app configuration:`)
    console.log(util.inspect(babelConfig, { compact: false, breakLength: 120, depth: null, colors }))
  }
  return babelConfig
}
