import React, { Component } from 'react';

import './App.css';

import {VmsList} from 'ovirt-ui-components'
import {VmDetail} from 'ovirt-ui-components'
import {VmsPageHeader} from 'ovirt-ui-components'
import { dispatchVmActions } from 'ovirt-ui-components'

class App extends Component {
  render () {
    const store = this.props.store

    const {vms, config, icons, userMessages} = store.getState()
    const dispatch = store.dispatch

    const selectedVmId = vms.get('selected')
    const selectedVm = selectedVmId ? vms.get('vms').find(vm => vm.get('id') === selectedVmId) : undefined

    const actions = dispatchVmActions({vm: selectedVm, dispatch, stopNestedPropagation: selectedVmId})

    return (<div>
      <VmsPageHeader userMessages={userMessages} config={config} dispatch={dispatch} title='oVirt User Portal'/>
      <div className="container-fluid">
        <VmsList vms={vms} icons={icons} config={config} dispatch={dispatch}/>
        <VmDetail vm={selectedVm} icons={icons} actions={actions} />
      </div>
    </div>)
  }
}
App.propTypes = {
  store: React.PropTypes.object.isRequired
}

export default App
