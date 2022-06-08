import tty from 'tty'
import url from 'url'
import util from 'util'
import { merge } from 'webpack-merge'
import commonConfig from './webpack.config.common.js'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'

import paths from './paths.cjs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const appPackageJson = require(paths.appPackageJson)

// TODO: Consider `publicUrlOrPath` handling from `react-dev-utils`
// We use "homepage" field to infer "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
function getPublicPath () {
  const homepagePath = appPackageJson.productionHomepage
  let publicPath = homepagePath ? new url.URL(homepagePath, 'foo:///').pathname : '/'
  if (!publicPath.endsWith('/')) {
    // If we don't do this, file assets will get incorrect paths.
    publicPath += '/'
  }
  return publicPath
}

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
export default (() => {
  const theConfig = {
    mode: 'production',
    devtool: 'source-map',

    stats: {
      groupAssetsByChunk: true,
      assetsSpace: 50,
    },

    output: {
      // Generated JS file names (with nested folders).
      // There will be one main bundle, and one file per asynchronous chunk.
      // We don't currently advertise code splitting but Webpack supports it.
      filename: 'static/js/[name].[chunkhash:8].js',
      chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
      // We already inferred the "public path"
      publicPath: getPublicPath(),
    },

    optimization: {
      moduleIds: 'deterministic',

      // Automatically split vendor and commons
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor',
            chunks: 'initial',
            test: /[\\/]node_modules[\\/]/,
          },
        },
      },

      // Keep the runtime chunk separated to enable long term caching
      runtimeChunk: 'single',

      minimize: true,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            keep_classnames: true,
            keep_fnames: true,
          },
        }),
        // when enabled for all code it strips too much for nested components
        // i.e. Select loses some styling when used via component/SelectBox
        // but looks OK when used directly
        new CssMinimizerPlugin({
          include: [paths.appSrc],
        }),
      ],
    },

    plugins: [

      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        filename: 'index.jsp',
        inject: true,
        template: paths.appHtml,
        publicPath: getPublicPath(),
        jspSSO: true,
        minify: {
          collapseWhitespace: false,
          keepClosingSlash: true,
          minifyJS: true,
          removeEmptyAttributes: true,
          removeRedundantAttributes: true,
        },
      }),
    ],
  }

  const mergedConfig = merge(commonConfig, theConfig)

  if (process.env.V) {
    const colors = tty.isatty(1)
    console.log('Production webpack configuration:')
    console.log(util.inspect(mergedConfig, { compact: false, breakLength: 120, depth: null, colors }))
  }
  return mergedConfig
})()
