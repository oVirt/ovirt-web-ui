import React, { PropTypes } from 'react';
import { connect } from 'react-redux'

import './App.css';

import {VmsList} from 'ovirt-ui-components'
import {VmDetail} from 'ovirt-ui-components'
import {VmsPageHeader} from 'ovirt-ui-components'

const App = ({ vms }) => {
  const selectedVmId = vms.get('selected')
  const selectedVm = selectedVmId ? vms.get('vms').find(vm => vm.get('id') === selectedVmId) : undefined
// const stopNestedPropagation = !selectedVm

  return (<div>
    <VmsPageHeader title='oVirt User Portal'/>
    <div className="container-fluid">
      <VmsList />
      <VmDetail vm={selectedVm}/>
    </div>
  </div>)
}
App.propTypes = {
  vms: PropTypes.object.isRequired
}

export default connect(
  (state) => ({
    vms: state.vms,
  })
)(App)
