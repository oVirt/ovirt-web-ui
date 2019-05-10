import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import { renderRoutes } from 'react-router-config'

import LoadingData from './components/LoadingData'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'
import SessionActivityTracker from './components/SessionActivityTracker'
import VmsPageHeader from './components/VmsPageHeader'
import ToastNotifications from './components/ToastNotifications'

import getRoutes from './routes'
import AppConfiguration from './config'
import { fixedStrings, resourcesUrls } from './branding'
import { msg } from '_/intl'

/**
 * Login (token) to Engine is missing.
 */
const NoLogin = ({ logoutWasManual = false }) => {
  return (
    <div>
      <nav className='navbar obrand_mastheadBackground obrand_topBorder navbar-pf-vertical'>
        <div className='navbar-header'>
          <a href='/' className='navbar-brand obrand_headerLogoLink' id='pageheader-logo'>
            <img className='obrand_mastheadLogo' src={resourcesUrls.clearGif} />
          </a>
        </div>
      </nav>
      <div className='container text-center'>
        <h1 className='bolder'>
          { logoutWasManual ? msg.logoutMessageManual() : msg.logoutMessageAutomatic() }
        </h1>

        <div style={{ margin: '25px 0' }}>
          { window.DEVELOPMENT ? msg.logoutDeveloperMessage() : msg.logoutRedirected() }
        </div>

        <div>
          <a href={AppConfiguration.applicationURL}>{msg.login()}</a>
        </div>
      </div>
    </div>
  )
}
NoLogin.propTypes = {
  logoutWasManual: PropTypes.bool.isRequired,
}

function isLoginMissing (config) {
  return !config.get('loginToken')
}

const UnsupportedBrowser = () => (
  <div className='unsupported-browser-container'>
    <div className='unsupported-browser-box'>
      <h2>
        {msg.ieNotSupported()}
        <br />
        {msg.useBrowserBelow()}
      </h2>
      <div className='browser-suggestions'>
        <h4>{msg.freeBrowsers()}</h4>
        <ul>
          <li><a href='https://www.mozilla.org/firefox/new/'>Mozilla Firefox</a></li>
          <li><a href='https://www.microsoft.com/en-us/windows/microsoft-edge'>Microsoft Edge</a></li>
          <li><a href='https://www.google.com/chrome/'>Google Chrome</a></li>
          <li><a href='https://www.apple.com/safari/'>Apple Safari</a></li>
        </ul>
      </div>
    </div>
  </div>
)

function isBrowserUnsupported () {
  return (navigator.userAgent.indexOf('MSIE') !== -1) || (!!document.documentMode === true)
}

/**
 * Main App component. Wrap the main react-router components together with
 * the various dialogs and error messages that may be needed.
 */
const App = ({ history, config, appReady }) => {
  if (isBrowserUnsupported()) {
    return <UnsupportedBrowser />
  }

  if (isLoginMissing(config)) {
    return <NoLogin logoutWasManual={config.get('logoutWasManual')} />
  }

  return (
    <ConnectedRouter history={history}>
      <div id='app-container'>
        <VmsPageHeader title={fixedStrings.BRAND_NAME + ' ' + msg.vmPortal()} />
        <OvirtApiCheckFailed />
        <SessionActivityTracker />
        { appReady && renderRoutes(getRoutes()) }
        <LoadingData />
        <ToastNotifications />
      </div>
    </ConnectedRouter>
  )
}
App.propTypes = {
  history: PropTypes.object.isRequired,

  config: PropTypes.object.isRequired,
  appReady: PropTypes.bool.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
    appReady: !!state.config.get('usbFilter'), // When is the app ready to display data components?
  })
)(App)
