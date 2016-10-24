import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'

import './index.css';
import '../node_modules/patternfly/dist/css/patternfly.css'
import '../node_modules/patternfly/dist/css/patternfly-additions.css'

window.$ = window.jQuery = require('../node_modules/jquery/dist/jquery');
var Bootstrap = {};
Bootstrap.$ = window.$;
require('../node_modules/bootstrap/dist/js/bootstrap');
require('../node_modules/patternfly/dist/js/patternfly');

import store, {sagaMiddleware} from './store'
import Selectors from './selectors'
import AppConfiguration, { readConfiguration } from './config'
import { loadTokenFromSessionStorage, loadStateFromLocalStorage } from './storage'
import { valuesOfObject } from './helpers'
import { rootSaga } from './sagas'
import { schedulerOneMinute } from './actions'

import App from './App'
import { login, updateIcons } from 'ovirt-ui-components'

function renderApp () {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}

function fetchToken () {
  // get token from session storage
  const {token, username} = loadTokenFromSessionStorage()
  if (token) {
    return {token, username}
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

function loadPersistedState () {
  // load persisted icons, etc ...
  const {icons} = loadStateFromLocalStorage()

  if (icons) {
    const iconsArray = valuesOfObject(icons)
    console.log(`loadPersistedState: ${iconsArray.length} icons loaded`)
    store.dispatch(updateIcons({icons: iconsArray}))
  }
}

function start () {
  readConfiguration()
  console.log(`Merged configuration: ${JSON.stringify(AppConfiguration)}`)

  const {token, username} = fetchToken()

  // re-render app every time the state changes
  store.subscribe(renderApp)

  // do initial render
  renderApp()

  // handle external actions
  sagaMiddleware.run(rootSaga)

  // initiate data retrieval
  Selectors.init({store})

  loadPersistedState()

  if (token) {
    store.dispatch(login({username, token}))
  } // otherwise wait for LoginForm or SSO

  // start cron-jobs
  store.dispatch(schedulerOneMinute())
}

start()
