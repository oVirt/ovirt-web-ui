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
import OptionsDialog from './components/OptionsDialog'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'
import NavigationConfirmationModal from './components/NavigationConfirmationModal'
import TokenExpired from './components/TokenExpired'
import ContainerFluid from './components/ContainerFluid'
import LoadingData from './components/LoadingData/index'

import VerticalMenu from './components/VerticalMenu'

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
class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      navigationConfirm: {
        show: false,
        confirmYes: undefined,
        confirmNo: undefined,
      },
    }
  }

  resetUserConfirmation (show = false, confirmYes = undefined, confirmNo = undefined) {
    this.setState({
      navigationConfirm: { show, confirmYes, confirmNo },
    })
  }

  render () {
    const { vms, visibility, config } = this.props

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

    const getUserConfirmation = (message, confirmCallback) => {
      this.resetUserConfirmation(true, () => { confirmCallback(true) }, () => { confirmCallback(false) })
    }
    const userConfirmationYes = () => {
      this.state.navigationConfirm.confirmYes()
      this.resetUserConfirmation()
    }
    const userConfirmationNo = () => {
      this.state.navigationConfirm.confirmNo()
      this.resetUserConfirmation()
    }

    return (
      <Router getUserConfirmation={getUserConfirmation} basename={AppConfiguration.applicationURL}>
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
          <NavigationConfirmationModal show={this.state.navigationConfirm.show} onYes={userConfirmationYes} onNo={userConfirmationNo} />
        </div>
      </Router>
    )
  }
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
