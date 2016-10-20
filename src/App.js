import React, { PropTypes } from 'react';
import { connect } from 'react-redux'

import './App.css';

import {VmsList} from 'ovirt-ui-components'
import {VmDetail} from 'ovirt-ui-components'
import {VmsPageHeader} from 'ovirt-ui-components'

import LoginForm from './LoginForm'

const App = ({ vms, loginToken }) => {
  const selectedVmId = vms.get('selected')
  const selectedVm = selectedVmId ? vms.get('vms').find(vm => vm.get('id') === selectedVmId) : undefined

  if (loginToken) {
    return (<div>
      <VmsPageHeader title='oVirt User Portal'/>
      <div className="container-fluid">
        <VmsList />
        <VmDetail vm={selectedVm}/>
      </div>
    </div>)
  }

  return (<LoginForm />)
}
App.propTypes = {
  vms: PropTypes.object.isRequired,
  loginToken: PropTypes.string,
}

export default connect(
  (state) => ({
    vms: state.vms,
    loginToken: state.config.get('loginToken'),
  })
)(App)
