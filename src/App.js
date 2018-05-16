import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import AboutDialog from './components/About'
import ContainerFluid from './components/ContainerFluid'
import LoadingData from './components/LoadingData'
import Options from './components/Options'
import OptionsDialog from './components/OptionsDialog'
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
const App = ({ vms, visibility, config }) => {
  if (!config.get('loginToken')) { // login is missing
    return (
      <ContainerFluid>
        <NoLogin />
      </ContainerFluid>
    )
  }

  let detailToRender = null
  switch (visibility.get('dialogToShow')) {
    case 'Options':
      detailToRender = (<Options />)
      break
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
        {detailToRender}
        <AboutDialog />
        <OptionsDialog userId={config.getIn(['user', 'id'])} />
        <OvirtApiCheckFailed />
        <TokenExpired />
      </div>
    </Router>
  )
}
App.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    visibility: state.visibility,
    config: state.config,
  })
)(App)
