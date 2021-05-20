const path = require('path')
const tty = require('tty')
const util = require('util')
const webpack = require('webpack')

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin')
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')

const postcssPresetEnv = require('postcss-preset-env')
const paths = require('./paths')
const env = require('./env')
const appPackageJson = require(paths.appPackageJson)

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT, 10) || 8192

var publicPath = '/'

// This is the development configuration.
// It is focused on developer experience and fast rebuilds.
module.exports = ((webpackEnv) => {
  const isEnvDevelopment = webpackEnv === 'development'
  const isEnvProduction = webpackEnv === 'production'
  let fontsToEmbed

  const theConfig = {
    mode: 'development',
    bail: true,
    devtool: isEnvDevelopment ? 'eval-source-map' : 'source-map',

    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: [
      // Include an alternative client for WebpackDevServer. A client's job is to
      // connect to WebpackDevServer by a socket and get notified about changes.
      // When you save a file, the client will either apply hot updates (in case
      // of CSS changes), or refresh the page (in case of JS changes). When you
      // make a syntax error, this client will display a syntax error overlay.
      // Note: instead of the default WebpackDevServer client, we use a custom one
      // to bring better experience for Create React App users. You can replace
      // the line below with these two lines if you prefer the stock client:
      require.resolve('webpack-dev-server/client') + '?/',
      require.resolve('webpack/hot/dev-server'),
      // When using the experimental react-refresh integration,
      // the webpack plugin takes care of injecting the dev client for us.
      // webpackDevClientEntry,

      // Polyfill and app code goes last so the dev server can stay running if
      // polyfill or app code is broken
      require.resolve('./polyfills'),
      paths.appIndexJs,
    ],

    output: {
      // Next line is not used in dev but WebpackDevServer crashes without it:
      path: paths.appBuild,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,
      // This does not produce a real file. It's just the virtual path that is
      // served by WebpackDevServer in development. This is the JS bundle
      // containing code from all our entry points, and the Webpack runtime.
      filename: 'static/js/bundle.js',
      chunkFilename: 'static/js/[name].chunk.js',
      // In development, we always serve from the root. This makes config easier.
      publicPath: publicPath,
      // Prevents conflicts when multiple webpack runtimes (from different apps)
      // are used on the same page.
      jsonpFunction: `webpackJsonp${appPackageJson.name}`,
      // this defaults to 'window', but by setting it to 'this' then
      // module chunks which are built will work in web workers as well.
      globalObject: 'this',
    },

    optimization: {
      // Automatically split vendor and commons
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor',
            chunks: 'initial',
            test: /[\\/]node_modules[\\/]/
          }
        },
      },

      // Keep the runtime chunk separated to enable long term caching
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`,
      },
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
                  configFile: false,
                  compact: isEnvProduction,

                  presets: [ './config/babel.app.config.js' ],

                  // This is a feature of `babel-loader` for webpack (not Babel itself).
                  // It enables caching results in ./node_modules/.cache/babel-loader/
                  // directory for faster rebuilds.
                  cacheDirectory: true,
                  cacheCompression: false,

                  // 'react-refresh/babel' plugin could be added here in future
                },
              },
            },

            // Process any JS outside of the app with Babel.
            {
              test: /\.(js|mjs)$/,
              include: [
                // for @patternfly/react-console
                '@novnc/novnc',
                '@spice-project/spice-html5',
              ].map(dependency => path.resolve(paths.appNodeModules, dependency)),
              use: {
                loader: 'babel-loader',
                options: {
                  babelrc: false,
                  configFile: false,
                  compact: false,

                  presets: [ './config/babel.dep.config.js' ],

                  cacheDirectory: true,
                  cacheCompression: false,

                  // Babel sourcemaps are needed for debugging into node_modules
                  // code.  Without the options below, debuggers like VSCode
                  // show incorrect code and set breakpoints on the wrong lines.
                  sourceMaps: true,
                  inputSourceMap: true,
                },
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
                  name: 'static/fonts/[name].[hash:8].[ext]'
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

            // "postcss-loader" applies autoprefixer to our CSS.
            // "css-loader" resolves paths in CSS and adds assets as dependencies.
            // "style-loader" turns CSS into JS modules that inject <style> tags.
            // MiniCssExtractPlugin extract CSS into separate files.
            // In production, we use a plugin to extract that CSS to a file, but
            // in development "style-loader" loader enables hot editing of CSS.

            // css modules for local style sheets without '-nomodules.css' suffix
            // ALL imported css from app source should be treated as css-modules except '-nomodules.css'
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
                      localIdentName: '[path][name]__[local]--[hash:base64:10]',
                    },
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    sourceMap: true,
                    postcssOptions: {
                      ident: 'postcss',
                      plugins: [
                        postcssPresetEnv({
                          autoprefixer: {
                            flexbox: 'no-2009',
                          },
                          stage: 3,
                        }),
                      ],
                    },
                  },
                }
              ],
            },

            // plain css for style sheets of dependencies and local with '-nomodules.css' suffix
            {
              test: /\.css$/,
              include: /(node_modules)|(-nomodules\.css$)/,
              use: [
                'style-loader',
                {
                  loader: 'css-loader',
                  options: {
                    importLoaders: 1,
                    sourceMap: true,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    sourceMap: true,
                    postcssOptions: {
                      ident: 'postcss',
                      plugins: [
                        postcssPresetEnv({
                          autoprefixer: {
                            flexbox: 'no-2009',
                          },
                          stage: 3,
                        }),
                      ],
                    },
                  },
                }
              ],
              // Don't consider CSS imports dead code (for tree shaking) even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
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
      // Copy sources not otherwise handled by webpack
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/ovirt-web-ui.config' },
          { from: paths.appBranding, to: 'branding', toType: 'dir' },
        ],
      }),

      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        filename: 'index.html',
        inject: true,
        template: `!!handlebars-loader!${paths.appHtml}`,
        publicPath,
        jspSSO: false,
      }),

      // This gives some necessary context to module not found errors, such as the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),

      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'development') { ... }. See `env.js`.
      new webpack.DefinePlugin(env),

      // Embed the small webpack runtime script in index.html
      isEnvProduction && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),

      // Keep the chunk id stable as long as the contents of the chunks stay the same (i.e. no new modules are used)
      isEnvProduction && new webpack.HashedModuleIdsPlugin(),

      // This is necessary to emit hot updates (CSS and Fast Refresh):
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),

      // Could do `ReactRefreshWebpackPlugin` here in future to support react-refresh

      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      isEnvDevelopment && new CaseSensitivePathsPlugin(),

      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      isEnvDevelopment && new WatchMissingNodeModulesPlugin(paths.appNodeModules),

      // Integrate linting to the build and notify of errors but don't fail to run
      // TODO: Add ESLintPlugin (https://github.com/webpack-contrib/eslint-webpack-plugin)
    ].filter(Boolean),

    // Some libraries import Node modules but don't use them in the browser.
    // Tell webpack to provide empty mocks for them so importing them works.
    node: {
      module: 'empty',
      dgram: 'empty',
      dns: 'mock',
      fs: 'empty',
      http2: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },

    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    // performance: false,
  }

  if (process.env.V) {
    const colors = tty.isatty(1)
    console.log(`${webpackEnv} webpack configuration:`)
    console.log(util.inspect(theConfig, { compact: false, breakLength: 120, depth: null, colors }))
  }
  return theConfig
})('development')
