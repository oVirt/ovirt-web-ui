var path = require('path')
var autoprefixer = require('autoprefixer')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
var WatchMissingNodeModulesPlugin = require('../scripts/utils/WatchMissingNodeModulesPlugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var paths = require('./paths')
var env = require('./env')
var webpackConfigCommons = require('./webpack.config.commons')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  // This is the development configuration.
  // It is focused on developer experience and fast rebuilds.
  mode: 'development',

  // Integrate https://github.com/facebook/create-react-app/pull/924 here.
  // You may want 'eval' instead if you prefer to see the compiled output in DevTools.
  // See the discussion in https://github.com/facebookincubator/create-react-app/issues/343.
  devtool: 'eval-source-map',

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
    // Note: resolve.extensions option no longer requires passing an empty string
    extensions: [
      '.js',
      '.json',
      '.jsx'
    ],
    alias: {
      // Support React Native Web
      // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
      'react-native': 'react-native-web',
      ...webpackConfigCommons.commonAliases()
    },
  },
  module: {
    rules: [
      // Process JS with Babel.
      {
        test: /\.(js|jsx)$/,
        include: [
          paths.appSrc,
          paths.novnc,
          paths.spiceHtml5
        ],
        loader: 'babel-loader',
        query: require('./babel.dev'),
      },
      // "postcss" loader applies autoprefixer to our CSS.
      // "css" loader resolves paths in CSS and adds assets as dependencies.
      // "style" loader turns CSS into JS modules that inject <style> tags.
      // In production, we use a plugin to extract that CSS to a file, but
      // in development "style" loader enables hot editing of CSS.

      // css modules for local stylesheets without '-nomodules.css' suffix
      {
        test: /\.css$/,
        exclude: /(node_modules)|(-nomodules\.css$)/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[path][name]__[local]--[hash:base64:10]'
            }
          },
          {
            loader: 'postcss-loader'
          }
        ]
      },

      // plain css for stylesheets of dependencies and local with '-nomodules.css' suffix
      {
        test: /\.css$/,
        include: /(node_modules)|(-nomodules\.css$)/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },

      // For webpack > 1, json-loader is not required anymore

      // "file" loader makes sure those assets get served by WebpackDevServer.
      // When you `import` an asset, you get its (virtual) filename.
      // In production, they would get copied to the `build` folder.
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
        exclude: /\/favicon.ico$/,
        loader: 'file-loader',
        query: {
          name: 'static/media/[name].[hash:8].[ext]',
        },
      },
      // A special case for favicon.ico to place it into build root directory.
      {
        test: /\/favicon.ico$/,
        include: [paths.appSrc],
        loader: 'file-loader',
        query: {
          name: 'favicon.ico?[hash:8]',
        },
      },
      // A special case for config.json to place it into build root directory.
      {
        test: /\/config.json$/,
        include: [paths.appSrc],
        loader: 'file-loader',
        query: {
          name: 'config.json?[hash:8]',
        },
      },
      // "url" loader works just like "file" loader but it also embeds
      // assets smaller than specified size as data URLs to avoid requests.
      {
        test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: 'static/media/[name].[hash:8].[ext]',
        },
      },
      // "html" loader is used to process template page (index.html) to resolve
      // resources linked with <link href="./relative/path"> HTML tags.
      {
        test: /\.html$/,
        loader: 'html-loader',
        query: {
          attrs: ['link:href'],
        },
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

    new ESLintPlugin({
      overrideConfigFile: path.join(__dirname, 'eslint.js'),
      useEslintrc: false,
      failOnError: true,
    }),
  ],
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
}

webpackConfigCommons.addFlowBabelWebpackPlugin(module.exports)
