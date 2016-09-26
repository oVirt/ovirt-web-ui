import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import '../node_modules/patternfly/dist/css/patternfly.css'
import '../node_modules/patternfly/dist/css/patternfly-additions.css'

import store, {sagaMiddleware} from './store'
import mySaga from './sagas'
import {login} from './actions'
import Api from './api'

import App from './App';

function renderApp () {
  ReactDOM.render(
    <App store={store} />,
    document.getElementById('root')
  )
}

function start () {
  // re-render app every time the state changes
  store.subscribe(renderApp)

  // do initial render
  renderApp()

  // handle external actions
  sagaMiddleware.run(mySaga)

  // initiate data retrieval
  Api.init({store})
  store.dispatch(login({username:'admin@internal', password:'admin'}))
}

start()