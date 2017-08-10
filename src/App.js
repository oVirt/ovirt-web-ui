import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import {
  BrowserRouter as Router,
} from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import VmsPageHeader from './components/VmsPageHeader/index'

import Options from './components/Options'
import AboutDialog from './components/About'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'
import CloseDialogConfirmation from './components/CloseDialogConfirmation/index'
import TokenExpired from './components/TokenExpired'
import ContainerFluid from './components/ContainerFluid'
import LoadingData from './components/LoadingData/index'

import VerticalMenu from './components/VerticalMenu'

import { getRoutes, getMenu } from './routes'
import rednerModal from './components/VmModals/rednerModal'
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
        {msg.pleaseLogIn()} <br /><a href={AppConfiguration.applicationURL}>Log in</a>
      </h1>
    </div>
  )
}

const App = ({ vms, visibility, config }) => {
  let detailToRender = null
  switch (visibility.get('dialogToShow')) {
    case 'Options':
      detailToRender = (<Options />)
      break
  }

  const routes = getRoutes(vms)
  const menu = getMenu()

  if (!config.get('loginToken')) { // login is missing
    return (
      <ContainerFluid>
        <NoLogin />
      </ContainerFluid>
    )
  }

  const openConfirmation = (message, callback) => {
    rednerModal({
      Component: CloseDialogConfirmation,
      onYes: () => {
        callback(true)
      },
      onNo: () => {
        callback(false)
      },
    })
  }

  return (
    <Router getUserConfirmation={openConfirmation} basename={AppConfiguration.applicationURL}>
      <div>
        <VmsPageHeader page={vms.get('page')} title={fixedStrings.BRAND_NAME + ' ' + msg.vmPortal()} />
        <VerticalMenu menuItems={menu} />
        <TokenExpired />
        <LoadingData />
        {renderRoutes(routes)}
        {detailToRender}
        <AboutDialog />
        <OvirtApiCheckFailed />
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
