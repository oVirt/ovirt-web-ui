import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import { renderRoutes } from 'react-router-config'

import { Grid } from 'patternfly-react'
import LoadingData from './components/LoadingData'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'
import TokenExpired from './components/TokenExpired'
import VmsPageHeader from './components/VmsPageHeader'

import getRoutes from './routes'
import AppConfiguration from './config'
import { fixedStrings } from './branding'
import { msg } from './intl'

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

/**
 * Main App component. Wrap the main react-router components together with
 * the various dialogs and error messages that may be needed.
 */
const App = ({ history, vms, config, appReady }) => {
  if (!config.get('loginToken')) { // login is missing
    return (
      <Grid fluid>
        <NoLogin />
      </Grid>
    )
  }

  const routes = getRoutes(vms)

  return (
    <ConnectedRouter history={history}>
      <React.Fragment>
        <VmsPageHeader title={fixedStrings.BRAND_NAME + ' ' + msg.vmPortal()} />
        { appReady && renderRoutes(routes) }
        <LoadingData />
        <OvirtApiCheckFailed />
        <TokenExpired />
      </React.Fragment>
    </ConnectedRouter>
  )
}
App.propTypes = {
  history: PropTypes.object.isRequired,

  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  appReady: PropTypes.bool.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
    appReady: state.config.get('isFilterChecked'), // When is the app ready to display data components?
  })
)(App)
