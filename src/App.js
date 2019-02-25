import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import { renderRoutes } from 'react-router-config'

import { Grid } from 'patternfly-react'
import LoadingData from './components/LoadingData'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'
import TokenExpiredTracker from './components/TokenExpiredTracker'
import VmsPageHeader from './components/VmsPageHeader'
import ToastNotifications from './components/ToastNotifications'

import getRoutes from './routes'
import AppConfiguration from './config'
import { fixedStrings } from './branding'
import { msg } from '_/intl'

/**
 * Login (token) to Engine is missing.
 */
const NoLogin = () => {
  return (
    <div className='blank-slate-pf'>
      <div className='blank-slate-pf-icon'>
        <span className='pficon pficon pficon-user' />
      </div>
      <h1>
        {msg.pleaseLogInTripleDot()} <br /><a href={AppConfiguration.applicationURL}>Log in</a>
      </h1>
    </div>
  )
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

/**
 * Main App component. Wrap the main react-router components together with
 * the various dialogs and error messages that may be needed.
 */
const App = ({ history, config, appReady }) => {
  if ((navigator.userAgent.indexOf('MSIE') !== -1) || (!!document.documentMode === true)) {
    return <UnsupportedBrowser />
  }
  if (!config.get('loginToken')) { // login is missing
    return (
      <Grid fluid>
        <NoLogin />
      </Grid>
    )
  }

  return (
    <ConnectedRouter history={history}>
      <div id='app-container'>
        <VmsPageHeader title={fixedStrings.BRAND_NAME + ' ' + msg.vmPortal()} />
        <OvirtApiCheckFailed />
        <TokenExpiredTracker />
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
    appReady: state.config.get('isFilterChecked'), // When is the app ready to display data components?
  })
)(App)
