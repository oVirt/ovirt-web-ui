import React, { Component } from 'react';
import './App.css';
import Vms from './vms'
import Header from './header.js'
import AuditLog from './auditlog'

// import {logDebug} from './helpers'
// import Playground from './playground'

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