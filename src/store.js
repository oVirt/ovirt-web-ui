// @flow
import { createStore, applyMiddleware, compose, type History, type StoreCreator, combineReducers } from 'redux'
import createSagaMiddleware, { type SagaMiddleware, type Task } from 'redux-saga'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createBrowserHistory } from 'history'

import AppConfiguration from '_/config'
import OvirtApi from '_/ovirtapi'
import reducers from '_/reducers'
import { rootSaga } from '_/sagas'

import { addActiveRequest, delayedRemoveActiveRequest } from '_/actions'

const composeEnhancers: any =
  (process.env.NODE_ENV !== 'production' &&
   window &&
   typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function' &&
   window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
     actionsBlacklist: ['ADD_ACTIVE_REQUEST', 'REMOVE_ACTIVE_REQUEST', 'DELAYED_REMOVE_ACTIVE_REQUEST'],
     maxAge: 100,
   })) ||
  compose

function initializeApiTransportListener (store: StoreCreator) {
  OvirtApi.addHttpListener((requestTracker, eventType) => {
    switch (eventType) {
      case 'START':
        store.dispatch(addActiveRequest(requestTracker))
        break

      case 'STOP':
        store.dispatch(delayedRemoveActiveRequest(requestTracker))
        break
    }
  })
}

/**
 * Configure the app's redux store with saga middleware, connected react-router,
 * and connected to the OvirtApi listeners.
 */
export default function configureStore (): StoreCreator & { rootTask: Task, history: History } {
  const sagaMiddleware: SagaMiddleware = createSagaMiddleware({
    onError (error: Error) {
      console.error('Uncaught saga error (store.js): ', error)
    },
  })

  // history to use for the connected react-router
  const history: History = createBrowserHistory({
    basename: AppConfiguration.applicationURL,
  })

  const store: StoreCreator = createStore(
    combineReducers({
      router: connectRouter(history),
      ...reducers,
    }),
    composeEnhancers(
      applyMiddleware(
        routerMiddleware(history),
        sagaMiddleware
      )
    )
  )

  initializeApiTransportListener(store)
  const rootTask: Task = sagaMiddleware.run(rootSaga)

  return {
    ...store,
    rootTask,
    history,
  }
}
