import React, { Component } from 'react';

import './App.css';

import {VmsList} from 'ovirt-ui-components'
import {VmDetail} from 'ovirt-ui-components'
import {VmsPageHeader} from 'ovirt-ui-components'

import {takeEvery, takeLatest} from 'redux-saga'

// TODO: move to API
export function *rootSaga () {
  yield [
    takeEvery("LOGIN", login),
    takeLatest("GET_ALL_VMS", fetchAllVms),
    takeEvery("GET_VM_ICON", fetchIcon),
    takeEvery("GET_VM_DISKS", fetchVmDisks),
    takeEvery("SHUTDOWN_VM", shutdownVm),
    takeEvery("RESTART_VM", restartVm),
    takeEvery("START_VM", startVm),
    takeEvery("GET_CONSOLE_VM", getConsoleVm),
    takeEvery("SUSPEND_VM", suspendVm)
  ]
}

class App extends Component {
  render () {
    const store = this.props.store

    const {vms, config, icons, userMessages} = store.getState()
    const dispatch = store.dispatch

    const selectedVmId = vms.get('selected')
    const selectedVm = selectedVmId ? vms.get('vms').find(vm => vm.get('id') === selectedVmId) : undefined

    return (<div>
      <VmsPageHeader userMessages={userMessages} config={config} dispatch={dispatch} title='oVirt User Portal'/>
      <div className="container-fluid">
        <VmsList vms={vms} icons={icons} config={config} dispatch={dispatch}/>
        <VmDetail vm={selectedVm} icons={icons} dispatch={dispatch}/>
      </div>
    </div>)
  }
}
App.propTypes = {
  store: React.PropTypes.object.isRequired
}

export default App
