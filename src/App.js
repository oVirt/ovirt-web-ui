import React, { Component } from 'react';
import './App.css';
import Vms from './vms'
// import {logDebug} from './helpers'
// import Playground from './playground'

class App extends Component {
  render () {
    const store = this.props.store
    // logDebug(`App.store: ${JSON.stringify(store.getState())}`)

    const {vms, config} = store.getState()
    const dispatch = store.dispatch

    // TODO: render auditLog
    return (<div> <Vms vms={vms} config={config} dispatch={dispatch} /> </div>)
    // return (<div> <Playground /> </div>)
  }
}

App.propTypes = {
  store: React.PropTypes.object.isRequired
}

export default App