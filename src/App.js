import React, { Component } from 'react';
import './App.css';
import Vms from './vms'
import Header from './header.js'
import AuditLog from './auditlog'

import { takeEvery, takeLatest } from 'redux-saga'
import {fetchAllVms, getConsoleVm, restartVm, shutdownVm, startVm, fetchVmIcons, login} from './sagas'

// import {logDebug} from './helpers'
// import Playground from './playground'

export function *rootSaga () {
    yield [
        takeEvery("LOGIN", login),
        takeLatest("GET_ALL_VMS", fetchAllVms),
        takeEvery("GET_VM_ICONS", fetchVmIcons),
        takeEvery("SHUTDOWN_VM", shutdownVm),
        takeEvery("RESTART_VM", restartVm),
        takeEvery("START_VM", startVm),
        takeEvery("GET_CONSOLE_VM", getConsoleVm)
    ]
}

class App extends Component {
  render () {
    const store = this.props.store

    const {vms, config, auditLog} = store.getState()
    const dispatch = store.dispatch

    // TODO: better positioning of the AuditLog on the page
    return (
        <div>
          <Header auditLog={auditLog} config={config} dispatch={dispatch}/>
          <div className="container-fluid">
            <AuditLog auditLog={auditLog} config={config} dispatch={dispatch}/>
            <Vms vms={vms} config={config} dispatch={dispatch}/>
          </div>
        </div>)

    // return (<div> <Playground /> </div>)
  }
}

App.propTypes = {
  store: React.PropTypes.object.isRequired
}

export default App