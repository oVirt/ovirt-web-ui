import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import LoadingData from '_/components/LoadingData'
import NoLogin from '_/components/NoLogin'

import getRoutes from '_/routes'
import { MsgContext } from '_/intl'

function isLoginMissing (config) {
  return !config.get('loginToken') || config.get('isTokenExpired')
}

const UnsupportedBrowser = () => {
  const { msg } = useContext(MsgContext)
  return (
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
}

function isBrowserUnsupported () {
  return (navigator.userAgent.indexOf('MSIE') !== -1) || (!!document.documentMode === true)
}

/**
 * Main App component. Wrap the main react-router components together with
 * the various dialogs and error messages that may be needed.
 */
const App = ({ config, appReady, activateSessionTracker }) => {
  if (isBrowserUnsupported()) {
    return <UnsupportedBrowser />
  }

  if (isLoginMissing(config)) {
    return <div id='app-container'><NoLogin logoutWasManual={config.get('logoutWasManual')} isTokenExpired={config.get('isTokenExpired')} /></div>
  }

  const routes = getRoutes({ appReady, activateSessionTracker })

  return (
    <div id='app-container'>
      <LoadingData />
      <RouterProvider router={createBrowserRouter(routes)} />
    </div>
  )
}
App.propTypes = {
  config: PropTypes.object.isRequired,
  appReady: PropTypes.bool.isRequired,
  activateSessionTracker: PropTypes.bool.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
    appReady: !!state.config.get('appConfigured'),
    activateSessionTracker: (state.config.get('userSessionTimeoutInterval') > 0),
  })
)(App)
