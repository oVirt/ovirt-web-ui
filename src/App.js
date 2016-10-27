import React, { PropTypes } from 'react';
import { connect } from 'react-redux'

import './App.css';

import {VmsList} from 'ovirt-ui-components'
import {VmDetail} from 'ovirt-ui-components'
import {VmsPageHeader} from 'ovirt-ui-components'
import {Options} from 'ovirt-ui-components'

import LoginForm from './LoginForm'

const App = ({ vms, visibility, loginToken }) => {
  const selectedVmId = visibility.get('selectedVmDetail')
  const showOptions = visibility.get('showOptions')

  let detailToRender = ''
  if (showOptions) {
    detailToRender = (<Options />)
  } else if (selectedVmId) {
    const selectedVm = selectedVmId ? vms.getIn(['vms', selectedVmId]) : undefined
    detailToRender = (<VmDetail vm={selectedVm} />)
  }

  if (loginToken) {
    return (<div>
      <VmsPageHeader title='oVirt User Portal'/>
      <div className="container-fluid navbar-top-offset">
        <VmsList />
        {detailToRender}
      </div>
    </div>)
  }

  return (<LoginForm />)
}
App.propTypes = {
  vms: PropTypes.object.isRequired,
  visibility: PropTypes.object.isRequired,
  loginToken: PropTypes.string,
}

export default connect(
  (state) => ({
    vms: state.vms,
    visibility: state.visibility,
    loginToken: state.config.get('loginToken'),
  })
)(App)
