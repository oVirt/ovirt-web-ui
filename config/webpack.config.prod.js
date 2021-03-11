var path = require('path')
var autoprefixer = require('autoprefixer')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var MiniCssExtractPlugin = require('mini-css-extract-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var url = require('url')
var paths = require('./paths')
var env = require('./env')
var webpackConfigCommons = require('./webpack.config.commons')

// Assert this just to be safe.
// Development builds of React are slow and not intended for production.
if (env['process.env.NODE_ENV'] !== '"production"') {
  throw new Error('Production builds must have NODE_ENV=production.')
}

// We use "homepage" field to infer "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
var homepagePath = require(paths.appPackageJson).productionHomepage
console.log('Building with homepagePath: ' + homepagePath)
var publicPath = homepagePath ? url.parse(homepagePath).pathname : '/'
if (!publicPath.endsWith('/')) {
  // If we don't do this, file assets will get incorrect paths.
  publicPath += '/'
}

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
module.exports = {
  mode: 'production',
  // Don't attempt to continue if there are any errors.
  bail: true,
  // We generate sourcemaps in production. This is slow but gives good results.
  // You can exclude the *.map files from the build during deployment.
  devtool: 'source-map',
  // In production, we only want to load the polyfills and the app code.
  entry: [
    require.resolve('./polyfills'),
    paths.appIndexJs,
  ],
  output: {
    // The build folder.
    path: paths.appBuild,
    // Generated JS file names (with nested folders).
    // There will be one main bundle, and one file per asynchronous chunk.
    // We don't currently advertise code splitting but Webpack supports it.
    filename: 'static/js/[name].[chunkhash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    // We inferred the "public path" (such as / or /my-project) from homepage.
    publicPath: publicPath,
  },
  resolve: {
    // These are the reasonable defaults supported by the Node ecosystem.
    // We also include JSX as a common component filename extension to support
    // some tools, although we do not recommend using it, see:
    // https://github.com/facebookincubator/create-react-app/issues/290
    // Note: resolve.extensions option no longer requires passing an empty string
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      // Support React Native Web
      // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
      'react-native': 'react-native-web',
      ...webpackConfigCommons.commonAliases()
    },
  },
  module: {
    // For webpack >= 2, module.loaders changed to module.rules
    rules: [
      {
        // module.preLoaders were removed
        // First, run the linter.
        // It's important to do this before Babel processes the JS.
        test: /\.(js|jsx)$/,
        loader: 'eslint-loader',
        include: paths.appSrc,
        options: {
          configFile: path.join(__dirname, 'eslint.js'),
          useEslintrc: false,
          failOnError: true,
        },
        enforce: 'pre'
      },
      // Process JS with Babel.
      {
        test: /\.(js|jsx)$/,
        include: [paths.appSrc, paths.novnc, paths.spiceHtml5],
        loader: 'babel-loader',
        query: require('./babel.prod'),
      },
      // The notation here is somewhat confusing.
      // "postcss" loader applies autoprefixer to our CSS.
      // "css" loader resolves paths in CSS and adds assets as dependencies.
      // "style" loader normally turns CSS into JS modules injecting <style>,
      // but unlike in development configuration, we do something different.
      // `ExtractTextPlugin` first applies the "postcss" and "css" loaders
      // (second argument), then grabs the result CSS and puts it into a
      // separate file in our build process. This way we actually ship
      // a single CSS file in production instead of JS code injecting <style>
      // tags. If you use code splitting, however, any async bundles will still
      // use the "style" loader inside the async code so CSS from them won't be
      // in the main CSS file.
      {
        test: /\.css$/,
        include: /(node_modules)|(-nomodules\.css$)/,
        // "?-autoprefixer" disables autoprefixer in css-loader itself:
        // https://github.com/webpack/css-loader/issues/281
        // We already have it thanks to postcss. We only pass this flag in
        // production because "css" loader only enables autoprefixer-powered
        // removal of unnecessary prefixes when Uglify plugin is enabled.
        // Webpack 1.x uses Uglify plugin as a signal to minify *all* the assets
        // including CSS. This is confusing and will be removed in Webpack 2:
        // https://github.com/webpack/webpack/issues/283
        // Note: this won't work without `new ExtractTextPlugin()` in `plugins`.

        // Note: ExtractTextPlugin is deprecated for webpack > 2, MiniCssExtractPlugin used instead
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          'css-loader?-autoprefixer!postcss-loader'
        ]
      },
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
              modules: true
            }
          },
          {
            loader: 'postcss-loader'
          }
        ]
      },

      // "file" loader makes sure those assets end up in the `build` folder.
      // When you `import` an asset, you get its filename.
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
        from: 'branding',
        to: 'branding',
        toType: 'dir'
      }]
    }),

    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      filename: 'index.jsp',
      inject: true,
      template: `!!handlebars-loader!${paths.appHtml}`,
      publicPath,
      jspSSO: true,
      minify: {
        removeComments: true,
        collapseWhitespace: false,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),

    // for webpack 4, DefinePlugin and UglifyJsPlugin are default in production mode

    // webpack.optimize.OccurrenceOrderPlugin,
    // which helps ensure the builds are consistent if source hasn't changed,
    // is enabled by default

    // To keep compatibility with old loaders, loaders can be switched to minimize mode via plugin:
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

    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css'
    })
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
