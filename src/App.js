import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import { Grid } from 'patternfly-react'
import LoadingData from './components/LoadingData'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'
import TokenExpired from './components/TokenExpired'
import VerticalMenu from './components/VerticalMenu'
import VmsPageHeader from './components/VmsPageHeader'

import { getRoutes, getMenu } from './routes'
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
const App = ({ vms, config }) => {
  if (!config.get('loginToken')) { // login is missing
    return (
      <Grid fluid>
        <NoLogin />
      </Grid>
    )
  }

  const routes = getRoutes(vms)
  const menu = getMenu()

  return (
    <Router basename={AppConfiguration.applicationURL}>
      <div>
        <VmsPageHeader page={vms.get('page')} title={fixedStrings.BRAND_NAME + ' ' + msg.vmPortal()} />
        <VerticalMenu menuItems={menu} /> { /* Disabled, to enable search for left sidebar menu */ }
        <LoadingData />
        {renderRoutes(routes)}
        <OvirtApiCheckFailed />
        <TokenExpired />
      </div>
    </Router>
  )
}
App.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
  })
)(App)
