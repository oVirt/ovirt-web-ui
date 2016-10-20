import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import '../node_modules/patternfly/dist/css/patternfly.css'
import '../node_modules/patternfly/dist/css/patternfly-additions.css'

window.$ = window.jQuery = require('../node_modules/jquery/dist/jquery');
var Bootstrap = {};
Bootstrap.$ = window.$;
require('../node_modules/bootstrap/dist/js/bootstrap');
require('../node_modules/patternfly/dist/js/patternfly');

import store, {sagaMiddleware} from './store'
import Api from './ovirtapi'
import AppConfiguration, { readConfiguration } from './config'
import { loadFromSessionStorage } from './helpers'

import { Provider } from 'react-redux'
import { rootSaga } from './sagas'

import App from './App'
import { login } from 'ovirt-ui-components'

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
  const token = loadFromSessionStorage('TOKEN');
  if (token) {
    const username = loadFromSessionStorage('USERNAME');
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

function start () {
  readConfiguration()
  console.log(`Merged configuration: ${JSON.stringify(AppConfiguration)}`)
  // ssoRedirectURL

  const {token, username} = fetchToken()

  // re-render app every time the state changes
  store.subscribe(renderApp)

  // do initial render
  renderApp()

  // handle external actions
  sagaMiddleware.run(rootSaga)

  // initiate data retrieval
  Api.init({store})

  if (token) {
    // store.dispatch(login({username:'admin@internal', password:'admin', token}))
    store.dispatch(login({username, token}))
  } // otherwise wait for LoginForm or SSO
}

start()
