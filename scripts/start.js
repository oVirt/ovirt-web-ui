// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

import chalk from 'chalk'
import readlineSync from 'readline-sync'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import detect from 'detect-port'
import checkRequiredFiles from './utils/checkRequiredFiles.js'
import prompt from './utils/prompt.js'
import createDevConfig from '../config/webpack.config.dev.js'
import fetch from 'node-fetch'
import https from 'https'
import fs from 'fs'
import dotenv from 'dotenv'
import paths from '../config/paths.js'

if (process.env.ENGINE_ENV) {
  const envFilePath = `.env.${process.env.ENGINE_ENV}`
  const envConfig = dotenv.parse(fs.readFileSync(envFilePath))
  console.log(chalk`{green Loaded configuration from:${envFilePath}}`)
  for (const k in envConfig) {
    // give higher priority to existing variables
    process.env[k] = process.env[k] || envConfig[k]
  }
}

const DEFAULT_PORT = Number(process.env.PORT ?? 3000)

function runDevServer (port, userInfo) {
  const engineUrl = process.env.ENGINE_URL
  const https = process.env.HTTPS === 'true'
  const host = 'localhost'

  const cleanTerminalMessage = [
    chalk`ENGINE_URL: {yellow ${engineUrl}}`,
    chalk`oVirt user: {yellow ${userInfo.userName}}, oVirt userId: {yellow ${userInfo.userId}}`,
    chalk`oVirt SSO token: {yellow ${userInfo.ssoToken}}`,
    process.env.BRANDING && chalk`Branding from: {yellow ${paths.appBranding}}`,
    process.env.KEEP_ALIVE && chalk`Keep SSO token alive interval (minutes): {yellow ${Number(process.env.KEEP_ALIVE)}}`,
    'The app is running at:' + chalk`  {cyan http${https ? 's' : ''}://${host}:${port}/}`,
  ].filter(Boolean).join('\n')

  const config = createDevConfig({
    userInfo,
    publicPath: '/',
    // publicPath : '/ovirt-engine/web-ui/',
    browser: process.env.BROWSER,
    engineUrl,
    port,
    https,
    host,
    cleanTerminalMessage,
  })

  const devServer = new WebpackDevServer(config.devServer, webpack(config))

  devServer.startCallback(() => {
    console.log(chalk`DevServer: {green  READY}`)
  })
}

function run (port) {
  checkRequiredFiles()
  getUserInfo().then(userInfo => {
    runDevServer(port, userInfo)
  }).catch(err => {
    console.error(`Failed obtaining oVirt auth token: ${err}`)
  })
}

// We attempt to use the default port but if it is busy, we offer the user to
// run on a different port. `detect()` Promise resolves to the next free port.
detect(DEFAULT_PORT).then(port => {
  if (port === DEFAULT_PORT) {
    run(port)
    return
  }

  const question =
    chalk`{yellow Something is already running on port ${DEFAULT_PORT}.}
          \n\nWould you like to run the app on another port instead?`

  prompt(question, true).then(shouldChangePort => {
    if (shouldChangePort) {
      run(port)
    }
  })
}).catch(err => {
  console.error(err)
})

async function getUserInfo () {
  let engineUrl = process.env.ENGINE_URL
  if (!engineUrl) {
    throw new Error('Please run script with the `ENGINE_URL` environment variable set.')
  }
  // remove trailing slash
  engineUrl = engineUrl.replace(/\/$/, '')

  console.log(`Please authenticate against oVirt running at ${engineUrl}`)

  const DEFAULT_USER = 'admin@internal'
  const DEFAULT_DOMAIN = 'internal-authz'

  const username = process.env.ENGINE_USER || readlineSync.question(`oVirt user (${DEFAULT_USER}): `, {
    defaultInput: DEFAULT_USER,
  })

  const password = process.env.ENGINE_PASSWORD || readlineSync.question('oVirt password: ', {
    noEchoBack: true,
  })

  const domain = process.env.ENGINE_DOMAIN || readlineSync.question(`oVirt domain (${DEFAULT_DOMAIN}): `, {
    defaultInput: DEFAULT_DOMAIN,
  })

  console.log('Connecting using provided credentials...')

  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  })

  const { access_token: ssoToken } = await fetch(
    `${engineUrl}/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api`,
    {
      agent: httpsAgent,
      headers: {
        Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    })
    .then(response => response.json())

  if (!ssoToken) {
    throw new Error('Missing access token!')
  }

  const fetchApi = () => fetch(
    `${engineUrl}/api/`,
    {
      agent: httpsAgent,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ssoToken}`,
      },
    })

  const { authenticated_user: { id: userId } = {} } = await fetchApi()
    .then(response => response.json())

  if (!userId) {
    throw new Error(`User ID cannot be resolved using ${engineUrl}/api/`)
  }

  keepSsoTokenAlive(fetchApi)

  return {
    userName: username.slice(0, username.indexOf('@')),
    ssoToken,
    domain,
    userId,
  }
}

function keepSsoTokenAlive (fetchApi) {
  if (!process.env.KEEP_ALIVE) {
    return
  }

  const minuteInterval = Number(process.env.KEEP_ALIVE) || 10
  setInterval(
    function () {
      fetchApi()
        .then(() => console.log(chalk`...pinged rest api {green OK}. Time: ${new Date()}`))
        .catch(error => console.log(chalk`...pinged rest api {red ERROR}:`, error))
    },
    minuteInterval * 60 * 1000)
}
