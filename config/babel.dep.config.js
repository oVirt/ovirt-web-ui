const tty = require('tty')
const util = require('util')

/*
 * The preset for ovirt-web-ui is based on the `babel-preset-react-app/dependencies`
 * package. We don't need everything that is done there, and we want to have specific
 * control over what is chosen in test, dev, and prod builds.
 *
 * See: https://github.com/facebook/create-react-app/blob/master/packages/babel-preset-react-app
 */
module.exports = function (api, opts = {}) {
  const env = process.env.BABEL_ENV || process.env.NODE_ENV;
  const verbose = process.env.V === '1'
  const isEnvDevelopment = env === 'development';
  const isEnvProduction = env === 'production';
  const isEnvTest = env === 'test'; // for jest running tests on nodejs

  const babelConfig = {
    // Babel assumes ES Modules, which isn't safe until CommonJS
    // dies. This changes the behavior to assume CommonJS unless
    // an `import` or `export` is present in the file.
    // https://github.com/webpack/webpack/issues/4039#issuecomment-419284940
    sourceType: 'unambiguous',

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
          useBuiltIns: 'usage',
          corejs: '3.12',
          exclude: [ 'transform-typeof-symbol' ],
        },
      ],
    ].filter(Boolean),

    plugins: [

      // // Polyfills the runtime needed for async/await, generators, and friends
      // // https://babeljs.io/docs/en/babel-plugin-transform-runtime
      // [
      //   '@babel/plugin-transform-runtime',
      //   {
      //     corejs: false,
      //     helpers: true,
      //     regenerator: true,
      //     useESModules: isEnvDevelopment || isEnvProduction,
      //     version: require('@babel/runtime/package.json').version,
      //   },
      // ],

    ].filter(Boolean),
  }

  if (verbose) {
    const colors = tty.isatty(1)
    console.log(`${env} babel.dep configuration:`)
    console.log(util.inspect(babelConfig, { compact: false, breakLength: 120, depth: null, colors }))
  }
  return babelConfig
}
