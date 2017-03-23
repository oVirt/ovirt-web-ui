// @flow

/**
  Flow agreement:
  For simple types, like number, boolean, string and etc.: use lower-case,
  For complex types, like Object, Array and etc.: use first letter in upper-case
**/
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import './index-nomodules.css'
import 'patternfly/dist/css/patternfly.css'
import 'patternfly/dist/css/patternfly-additions.css'

// Patternfly dependencies
// jQuery needs to be globally available (webpack.ProvidePlugin can be also used for this)
window.$ = window.jQuery = require('jquery')
require('bootstrap/dist/js/bootstrap')
window.patternfly = {}
window.patternfly = require('patternfly/dist/js/patternfly')
window.selectpicker = require('bootstrap-select/js/bootstrap-select.js')
window.combobox = require('patternfly-bootstrap-combobox/js/bootstrap-combobox.js')

import store, { sagaMiddleware } from './store'
import Selectors from './selectors'
import AppConfiguration, { readConfiguration } from './config'
import { loadStateFromLocalStorage } from './storage'
import { logDebug, logError, valuesOfObject } from './helpers'
import { rootSaga } from './sagas'
import { schedulerOneMinute, login, updateIcons, setDomain } from './actions'

import App from './App'

function renderApp () {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}

/**
 * oVirt SSO is required
 *
 * SsoPostLoginFilter (aaa.jar, ovirt-engine) must be configured to provide logged-user details to session.
 * HTML entry point (the index.jsp) stored session data into JavaScript's 'window' object.
 *
 * See web.xml.
 */
function fetchToken (): { token: string, username: string, domain: string } {
  const userInfo = window.userInfo
  logDebug(`SSO userInfo: ${JSON.stringify(userInfo)}`)

  if (userInfo) {
    return {
      token: userInfo.ssoToken,
      username: userInfo.userName,
      domain: userInfo.domain,
    }
  }
  return {
    token: '',
    username: '',
    domain: '',
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
  console.log(`Current configuration: ${JSON.stringify(AppConfiguration)}`)

  const { token, username, domain }: { token: string, username: string, domain: string } = fetchToken()

  // do initial render
  renderApp()

  // handle external actions
  sagaMiddleware.run(rootSaga)

  // initiate data retrieval
  Selectors.init({ store })

  loadPersistedState()

  store.dispatch(setDomain({ domain }))
  if (token) {
    store.dispatch(login({ username, token }))
  } else {
    logError('Missing SSO Token!')
  }

  // start cron-jobs
  store.dispatch(schedulerOneMinute())
}

start()
