// @flow
/**
 Flow agreement:
 For simple types, like number, boolean, string and etc.: use lower-case,
 For complex types, like Object, Array and etc.: use first letter in upper-case
 **/

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { IntlProvider } from 'react-intl'

import logger from './logger'

// TODO: Look at this WRT patternfly-react CSS!!!!!!!
import 'patternfly/dist/css/patternfly.css'
import 'patternfly/dist/css/patternfly-additions.css'
import './index-nomodules.css'
import * as branding from './branding'

import { getSelectedMessages, locale } from './intl'
import configureStore from './store'
import Selectors from './selectors'
import AppConfiguration, { readConfiguration } from './config'
import { loadStateFromLocalStorage } from './storage'
import { valuesOfObject } from './helpers'
import { rootSaga } from './sagas'
import {
  login,
  updateIcons,
  setDomain,
  addActiveRequest,
  delayedRemoveActiveRequest,
} from './actions'
import OvirtApi from './ovirtapi'

import App from './App'
import GlobalErrorBoundary from './GlobalErrorBoundary'

// Patternfly dependencies
// jQuery needs to be globally available (webpack.ProvidePlugin can be also used for this)
window.$ = window.jQuery = require('jquery')
require('bootstrap/dist/js/bootstrap')
window.patternfly = {}
window.patternfly = require('patternfly/dist/js/patternfly')
window.selectpicker = require('bootstrap-select/js/bootstrap-select.js')
window.combobox = require('patternfly-bootstrap-combobox/js/bootstrap-combobox.js')

function renderApp (store: Object) {
  ReactDOM.render(
    <GlobalErrorBoundary>
      <Provider store={store}>
        <IntlProvider locale={locale} messages={getSelectedMessages()}>
          <App history={store.history} />
        </IntlProvider>
      </Provider>
    </GlobalErrorBoundary>,

    (document.getElementById('root'): any)
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
function fetchToken (): { token: string, username: string, domain: string, userId: string } {
  const userInfo = window.userInfo
  logger.log(`SSO userInfo: ${JSON.stringify(userInfo)}`)

  if (userInfo) {
    return {
      token: userInfo.ssoToken,
      username: userInfo.userName,
      domain: userInfo.domain,
      userId: userInfo.userId,
    }
  }
  return {
    token: '',
    username: '',
    domain: '',
    userId: '',
  }
}

function loadPersistedState (store: Object) {
  // load persisted icons, etc ...
  const { icons } = loadStateFromLocalStorage()

  if (icons) {
    const iconsArray = valuesOfObject(icons)
    logger.log(`loadPersistedState: ${iconsArray.length} icons loaded`)
    store.dispatch(updateIcons({ icons: iconsArray }))
  }
}

function addBrandedResources () {
  addLinkElement('shortcut icon', branding.resourcesUrls.favicon)
  addLinkElement('stylesheet', branding.resourcesUrls.brandStylesheet)
  addLinkElement('stylesheet', branding.resourcesUrls.baseStylesheet)
}

function addLinkElement (rel: string, href: string) {
  const linkElement = window.document.createElement('link')
  linkElement.rel = rel
  linkElement.href = href
  window.document.head.appendChild(linkElement)
}

function initializeApiListener (store: Object) {
  OvirtApi.addHttpListener((requestId, eventType) => {
    if (eventType === 'START') {
      store.dispatch(addActiveRequest(requestId))
      return
    }
    if (eventType === 'STOP') {
      store.dispatch(delayedRemoveActiveRequest(requestId))
    }
  })
}

function onResourcesLoaded () {
  logger.log(`Current configuration: ${JSON.stringify(AppConfiguration)}`)

  addBrandedResources()

  const store = configureStore()
  store.runSaga(rootSaga)
  Selectors.init({ store })
  initializeApiListener(store)
  loadPersistedState(store)

  // do initial render
  renderApp(store)

  const { token, username, domain, userId }: { token: string, username: string, domain: string, userId: string } = fetchToken()
  store.dispatch(setDomain({ domain }))
  if (token) {
    store.dispatch(login({ username, token, userId }))
  } else {
    logger.error('Missing SSO Token!')
  }
}

function start () {
  readConfiguration()
    .then(branding.loadOnce)
    .then(onResourcesLoaded)
}

start()
