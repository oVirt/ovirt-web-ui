var path = require('path')
const util = require('util')
const tty = require('tty')
var autoprefixer = require('autoprefixer')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
var WatchMissingNodeModulesPlugin = require('../scripts/utils/WatchMissingNodeModulesPlugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var paths = require('./paths')
var env = require('./env')

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false'

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT, 10) || 8192

// This is the development configuration.
// It is focused on developer experience and fast rebuilds.
module.exports = ((webpackEnv) => {
  const isEnvDevelopment = webpackEnv === 'development'
  const isEnvProduction = webpackEnv === 'production'
  let fontsToEmbed

  const theConfig = {
    mode: 'development',
    bail: true,
    devtool: shouldUseSourceMap ? 'eval-source-map' : false,

    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    // The first two entry points enable "hot" CSS and auto-refreshes for JS.
    entry: [
      // Include WebpackDevServer client. It connects to WebpackDevServer via
      // sockets and waits for recompile notifications. When WebpackDevServer
      // recompiles, it sends a message to the client by socket. If only CSS
      // was changed, the app reload just the CSS. Otherwise, it will refresh.
      // The "?/" bit at the end tells the client to look for the socket at
      // the root path, i.e. /sockjs-node/. Otherwise visiting a client-side
      // route like /todos/42 would make it wrongly request /todos/42/sockjs-node.
      // The socket server is a part of WebpackDevServer which we are using.
      // The /sockjs-node/ path I'm referring to is hardcoded in WebpackDevServer.
      require.resolve('webpack-dev-server/client') + '?/',
      // Include Webpack hot module replacement runtime. Webpack is pretty
      // low-level so we need to put all the pieces together. The runtime listens
      // to the events received by the client above, and applies updates (such as
      // new CSS) to the running application.
      require.resolve('webpack/hot/dev-server'),
      // We ship a few polyfills by default.
      require.resolve('./polyfills'),
      // Finally, this is your app's code:
      paths.appIndexJs,
      // We include the app code last so that if there is a runtime error during
      // initialization, it doesn't blow up the WebpackDevServer client, and
      // changing JS code would still trigger a refresh.
    ],

    output: {
      // Next line is not used in dev but WebpackDevServer crashes without it:
      path: paths.appBuild,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: true,
      // This does not produce a real file. It's just the virtual path that is
      // served by WebpackDevServer in development. This is the JS bundle
      // containing code from all our entry points, and the Webpack runtime.
      filename: 'static/js/bundle.js',
      // In development, we always serve from the root. This makes config easier.
      publicPath: '/',
    },

    resolve: {
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebookincubator/create-react-app/issues/290
      extensions: ['.js', '.json', '.jsx'],

      alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
        '_': `${paths.appSrc}`,
      },
    },

    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },
        {
          // oneOf lets us have a loader w/o a test as a default instead of applying to everything
          // https://webpack.js.org/configuration/module/#ruleoneof
          oneOf: [
            // Process application JS with Babel.
            {
              test: /\.(js|jsx)$/,
              include: [
                paths.appSrc,
              ],
              use: {
                loader: 'babel-loader',
                options: {
                  babelrc: false,
                  compact: isEnvProduction,

                  // Utilize 'babel-preset-react-app' to make it easier to keep up with
                  // useful babel config changes from the Create React App project
                  presets: [
                    [ "react-app", { "flow": true, "typescript": false } ]
                  ],

                  // This is a feature of `babel-loader` for webpack (not Babel itself).
                  // It enables caching results in ./node_modules/.cache/babel-loader/
                  // directory for faster rebuilds.
                  cacheDirectory: true,
                  cacheCompression: false,

                  //
                  // 'react-refresh/babel' plugin could be added here in future
                  //
                },
              },
            },

            // Process any JS outside of the app with Babel.
            {
              test: /\.(js|mjs)$/,
              include: [
                paths.novnc,
                paths.spiceHtml5
              ],
              use: {
                loader: 'babel-loader',
                options: {
                  babelrc: false,
                  configFile: false,
                  compact: false,

                  presets: [
                    [
                      require.resolve('babel-preset-react-app/dependencies'),
                      { helpers: true },
                    ],
                  ],

                  cacheDirectory: true,
                  cacheCompression: false,

                  // Babel sourcemaps are needed for debugging into node_modules
                  // code.  Without the options below, debuggers like VSCode
                  // show incorrect code and set breakpoints on the wrong lines.
                  sourceMaps: shouldUseSourceMap,
                  inputSourceMap: shouldUseSourceMap,
                }
              },
            },

            // inline base64 URLs for <= 8k images, direct URLs for the rest
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              use: {
                loader: 'url-loader',
                options: {
                  limit: imageInlineSizeLimit,
                  name: 'static/media/[name].[hash:8].[ext]',
                },
              },
            },

            // embed the woff2 fonts and any fonts that are used by the PF icons
            // directly in the CSS (to avoid lag applying fonts), export the rest
            // to be loaded separately as needed
            {
              test: fontsToEmbed = [
                /\.woff2(\?v=[0-9].[0-9].[0-9])?$/,
                /PatternFlyIcons-webfont\.ttf/
              ],
              use: {
                loader: 'url-loader',
                options: {}
              }
            },
            {
              test: /\.(ttf|eot|svg|woff(?!2))(\?v=[0-9].[0-9].[0-9])?$/,
              exclude: fontsToEmbed,
              use: {
                loader: 'file-loader',
                options: {
                  name: 'fonts/[name].[hash:8].[ext]'
                }
              }
            },

            // A special case for favicon.ico to place it into build root directory.
            {
              test: /\/favicon.ico$/,
              include: [paths.appSrc],
              use: {
                loader: 'file-loader',
                options: {
                  name: 'favicon.ico?[hash:8]',
                },
              },
            },

            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use a plugin to extract that CSS to a file, but
            // in development "style" loader enables hot editing of CSS.

            // css modules for local style sheets without '-nomodules.css' suffix
            {
              test: /\.css$/,
              exclude: /(node_modules)|(-nomodules\.css$)/,
              use: [
                'style-loader',
                {
                  loader: 'css-loader',
                  options: {
                    importLoaders: 1,
                    sourceMap: true,
                    modules: {
                      // TODO: ALL import app css should be 'modules' except '-nomodules.css'
                      localIdentName: '[path][name]__[local]--[hash:base64:10]',
                    },
                  },
                },
                {
                  loader: 'postcss-loader'
                }
              ],
              // Don't consider CSS imports dead code (for tree shaking) even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },

            // plain css for style sheets of dependencies and local with '-nomodules.css' suffix
            {
              test: /\.css$/,
              include: /(node_modules)|(-nomodules\.css$)/,
              use: [
                'style-loader',
                'css-loader',
                'postcss-loader'
              ]
            },

            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader **doesn't use a "test"** so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpack's internal loaders.
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              use: {
                loader: 'file-loader',
                options: {
                  name: 'static/media/[name].[hash:8].[ext]',
                },
              },
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ],
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: [
        {
          from: 'src/ovirt-web-ui.config',
        },
        {
          from: paths.appBranding,
          to: 'branding',
          toType: 'dir'
        }]
      }),

      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        filename: 'index.html',
        inject: true,
        template: `!!handlebars-loader!${paths.appHtml}`,
        publicPath: '/',
        jspSSO: false,
      }),

      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'development') { ... }. See `env.js`.
      new webpack.DefinePlugin(env),

      // webpack >= 2 no longer allows custom properties in configuration
      new webpack.LoaderOptionsPlugin({
        options: {
          // We use PostCSS for autoprefixing only.
          postcssLoader: function () {
            return [
              autoprefixer({
                browsers: [
                  '>1%',
                  'last 4 versions',
                  'Firefox ESR',
                  'not ie > 0', // VM Portal don't support IE at all
                ],
                grid: false,
              }),
            ]
          },
        }
      }),

      // This is necessary to emit hot updates (currently CSS only):
      new webpack.HotModuleReplacementPlugin(),

      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebookincubator/create-react-app/issues/240
      new CaseSensitivePathsPlugin(),

      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebookincubator/create-react-app/issues/186
      new WatchMissingNodeModulesPlugin(paths.appNodeModules),

    ],

    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
    },
  }

  if (!process.env.Q) {
    const colors = tty.isatty(1)
    console.log('development webpack configuration:')
    console.log(util.inspect(theConfig, { compact: false, breakLength: 120, depth: null, colors }))
  }
  return theConfig
})('development')
