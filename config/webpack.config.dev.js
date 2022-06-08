import tty from 'tty'
import util from 'util'
import { merge } from 'webpack-merge'
import commonConfig from './webpack.config.common.js'

import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CleanTerminalPlugin from 'clean-terminal-webpack-plugin'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'

import paths from './paths.cjs'

// This is the development configuration.
// It is focused on developer experience and fast rebuilds.
export default ({
  userInfo = {},
  publicPath = '/',
  browser = 'chromium-browser',
  engineUrl = 'http://localhost:8080',
  port = 3000,
  host = 'localhost',
  https = false,
  cleanTerminalMessage = 'Dev server running...',
} = {}) => {
  const isClientDefaultAppConfig = publicPath === '/'
  const isServerDefaultAppConfig = publicPath === '/ovirt-engine/web-ui/'

  const theConfig = {
    devServer: {
      host,
      port,
      https,
      historyApiFallback: {
        index: publicPath,
      },
      client: {
        logging: 'info',
        progress: true,
      },
      hot: true,
      open: browser !== 'none' && {
        app: {
          name: browser,
        },
      },
      proxy: [
        isClientDefaultAppConfig &&
        {
          /*
            Using client side defaults from src/config.js
            Note: fetching ovirt-web-ui.config relies on hardcoded path and will fail.
           */
          context: ['/auth', '/api', '/services', '/web-ui'],
          target: engineUrl,
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
        },
        isServerDefaultAppConfig && {
          /*
          Assumptions:
          1. standard ENGINE_URL: host:port/ovirt-engine
          2. standard ovirt-engine/web-ui/ovirt-web-ui.config
        {
          "applicationContext": "/ovirt-engine",
          "applicationURL": "/ovirt-engine/web-ui", with content:
          "applicationLogoutURL": "/ovirt-engine/web-ui/sso/logout",
        }
        */
          context: ['/ovirt-engine'],
          target: engineUrl,
          changeOrigin: true,
          secure: false,
          // remove duplicated "ovirt-engine" section from path
          pathRewrite: { '^/ovirt-engine': '' },
          logLevel: 'debug',
        },
      ].filter(Boolean),
    },

    mode: 'development',
    devtool: 'eval-source-map',

    stats: 'minimal',

    output: {
      publicPath: publicPath,
    },

    plugins: [

      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        filename: 'index.html',
        inject: true,
        template: paths.appHtml,
        publicPath,
        jspSSO: false,
        userInfo: JSON.stringify(userInfo),
      }),

      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      new CaseSensitivePathsPlugin(),

      new CleanTerminalPlugin({
        message: cleanTerminalMessage,
        onlyInWatchMode: true,
        skipFirstRun: true,
        beforeCompile: true,
      }),

      new ReactRefreshWebpackPlugin(),
    ],
  }

  const mergedConfig = merge(commonConfig, theConfig)

  if (process.env.V) {
    const colors = tty.isatty(1)
    console.log('Dev webpack configuration:')
    console.log(util.inspect(mergedConfig, { compact: false, breakLength: 120, depth: null, colors }))
  }
  return mergedConfig
}
