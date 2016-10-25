import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
// import { Router, Route, browserHistory } from 'react-router'

import './index.css'
import 'patternfly/dist/css/patternfly.css'
import 'patternfly/dist/css/patternfly-additions.css'

// Patternfly dependencies
// jQuery needs to be globally available (webpack.ProvidePlugin can be also used for this)
window.$ = window.jQuery = require('jquery')
require('bootstrap/dist/js/bootstrap')
window.patternfly = {}
window.patternfly = require('patternfly/dist/js/patternfly')

import store, { sagaMiddleware } from './store'
import Selectors from './selectors'
import AppConfiguration, { readConfiguration } from './config'
import { loadStateFromLocalStorage } from './storage'
import { valuesOfObject } from './helpers'
import { rootSaga } from './sagas'
import { schedulerOneMinute } from './actions'

import App from './App'
// import LoginForm from './LoginForm'
import { login, updateIcons, logDebug, logError } from 'ovirt-ui-components'
/*
function requireLogin (nextState, replace) {
  let token = store.getState().config.get('loginToken')
  if (!token) {
    replace({
      pathname: `${AppConfiguration.applicationURL}/login`,
      state: { nextPathname: nextState.location.pathname },
    })
  }
}
*/

function renderApp () {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}
/*
function renderAppWithRouter () {
  const urlPrefix = `${AppConfiguration.applicationURL}`
  ReactDOM.render(
    <Provider store={store}>
      <Router history={browserHistory}>
        <Route path={`${urlPrefix}/`} component={App} />
      </Router>
    </Provider>,
    document.getElementById('root')
  )
}
*/
/*
function fetchToken () {
  // get token from session storage
  const { token, username } = loadTokenFromSessionStorage()
  if (token) {
    return { token, username }
  }

  if (AppConfiguration.sso && AppConfiguration.ssoRedirectURL && AppConfiguration.userPortalURL) {
    // TODO: get request header for SSO token/username; store to session storage; continue with token
    // TODO: return {token, username}

    // else redirect to SSO
    const language = window.navigator.userLanguage || window.navigator.language
    const ssoUrl = AppConfiguration.ssoRedirectURL
      .replace('[UP_URL]', encodeURIComponent(AppConfiguration.userPortalURL))
      .replace('[LOCALE]', encodeURIComponent(language))
    window.location.replace(ssoUrl)
    // END OF THIS APP
  } else {
    // SSO is not configured, show LoginForm
    console.log('SSO is not configured, rendering own Login Form. Please consider setting "ssoRedirectURL" and "userPortalURL" in the userportal.config file.')
    return {}
  }
}
*/

/**
 * oVirt SSO is required
 *
 * SsoPostLoginFilter (aaa.jar, ovirt-engine) must be configured to provide logged-user details to session.
 * HTML entry point (the index.jsp) stored session data into JavaScript's 'window' object.
 *
 * See web.xml.
 */
function fetchToken () {
  const userInfo = window.userInfo
  logDebug(`SSO userInfo: ${JSON.stringify(userInfo)}`)

  if (userInfo) {
    return {
      token: userInfo.ssoToken,
      username: userInfo.userName,
    }
  }
}

function loadPersistedState () {
  // load persisted icons, etc ...
  const { icons } = loadStateFromLocalStorage()

  if (icons) {
    const iconsArray = valuesOfObject(icons)
    console.log(`loadPersistedState: ${iconsArray.length} icons loaded`)
    store.dispatch(updateIcons({ icons: iconsArray }))
  }
}

function start () {
  readConfiguration()
  console.log(`Merged configuration: ${JSON.stringify(AppConfiguration)}`)

  const { token, username } = fetchToken()

  // do initial render
  renderApp()

  // handle external actions
  sagaMiddleware.run(rootSaga)

  // initiate data retrieval
  Selectors.init({ store })

  loadPersistedState()

  if (token) {
    store.dispatch(login({ username, token }))
  } else {
    logError('Missing SSO Token!')
  }

  // start cron-jobs
  store.dispatch(schedulerOneMinute())
}

start()
