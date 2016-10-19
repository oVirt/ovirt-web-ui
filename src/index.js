import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import '../node_modules/patternfly/dist/css/patternfly.css'
import '../node_modules/patternfly/dist/css/patternfly-additions.css'

window.$ = window.jQuery = require('../node_modules/jquery/dist/jquery');
var Bootstrap = {};
Bootstrap.$ = window.$;
require('../node_modules/bootstrap/dist/js/bootstrap');
require('../node_modules/patternfly/dist/js/patternfly');

import store, {sagaMiddleware} from './store'
import Api from './ovirtapi'

import { Provider } from 'react-redux'
import App from './App'
import { rootSaga } from './sagas'

import {login} from 'ovirt-ui-components'

function renderApp () {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  )
}

function start () {
  // re-render app every time the state changes
  store.subscribe(renderApp)

  // do initial render
  renderApp()

  // handle external actions
  sagaMiddleware.run(rootSaga)

  // initiate data retrieval
  Api.init({store}) // TODO: avoid init() call
  store.dispatch(login({username:'admin@internal', password:'admin'}))
}

start()
