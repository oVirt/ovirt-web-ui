import webpack from 'webpack'

import CopyWebpackPlugin from 'copy-webpack-plugin'
import ESLintPlugin from 'eslint-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

import paths from './paths.cjs'
import env from './env.js'

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT, 10) || 8192

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
export default (() => {
  let fontsToEmbed

  const theConfig = {
    bail: true,

    entry: [
      paths.appIndexJs,
    ],

    output: {
      // The build folder.
      path: paths.appBuild,
    },

    resolve: {
      extensions: ['.js', '.json', '.jsx'],
      alias: {
        _: `${paths.appSrc}`,
      },
      fallback: {
        module: false,
        dgram: false,
        dns: false,
        fs: false,
        http2: false,
        net: false,
        tls: false,
        child_process: false,
      },
    },

    module: {
      parser: {
        javascript: {
          exportsPresence: 'error',
        },
      },
      rules: [
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
                  compact: true,

                  presets: ['./config/babel.app.config.cjs'],

                  // This is a feature of `babel-loader` for webpack (not Babel itself).
                  // It enables caching results in ./node_modules/.cache/babel-loader/
                  // directory for faster rebuilds.
                  cacheDirectory: true,
                  cacheCompression: false,
                },
              },
            },

            // embed the woff2 fonts and any fonts that are used by the PF icons
            // directly in the CSS (to avoid lag applying fonts), export the rest
            // to be loaded separately as needed
            {
              test: fontsToEmbed = [
                /\.woff2(\?v=[0-9].[0-9].[0-9])?$/,
                /PatternFlyIcons-webfont\.ttf/,
              ],
              type: 'asset/inline',
            },

            {
              // TODO: exclude svg from fonts
              test: /\.(ttf|eot|svg|woff(?!2))(\?v=[0-9].[0-9].[0-9])?$/,
              exclude: fontsToEmbed,
              // automatically inline fonts <= 8k, , direct URLs for the rest
              type: 'asset',
              generator: {
                filename: 'static/fonts/[name].[hash:8][ext]',
              },
            },

            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
              // automatically inline images less then provided limit, , direct URLs for the rest
              type: 'asset',
              generator: {
                filename: 'static/media/[name].[hash:8][ext]',
              },
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },

            // A special case for favicon.ico to place it into build root directory.
            {
              test: /\/favicon.ico$/,
              include: [paths.appSrc],
              type: 'asset/resource',
              generator: {
                filename: 'favicon.ico?[hash:8]',
              },
            },

            // "css-loader" resolves paths in CSS and adds assets as dependencies.
            // MiniCssExtractPlugin extract CSS into separate files.
            // css modules for local style sheets without '-nomodules.css' suffix
            // ALL imported css from app source should be treated as css-modules except '-nomodules.css'
            {
              test: /\.css$/,
              exclude: /(node_modules)|(-nomodules\.css$)/,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
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
              ],
            },

            // plain css for style sheets of dependencies and local with '-nomodules.css' suffix
            {
              test: /\.css$/,
              include: /(node_modules)|(-nomodules\.css$)/,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: 'css-loader',
                  options: {
                    importLoaders: 1,
                    sourceMap: true,
                  },
                },
              ],
              // Don't consider CSS imports dead code (for tree shaking) even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },

            {
              test: /\.hbs$/,
              loader: 'handlebars-loader',
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
              exclude: [
                /\.(js|mjs|jsx|ts|tsx)$/,
                /\.html$/,
                /\.json$/,
                /^$/, // inline javascript assets without name
              ],
              type: 'asset/resource',
              generator: {
                filename: 'static/media/[name].[hash:8][ext]',
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

      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'development') { ... }. See `env.js`.
      new webpack.DefinePlugin(env),

      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[id].[contenthash:8].css',
      }),

      new ESLintPlugin(),
    ],
  }

  return theConfig
})()
