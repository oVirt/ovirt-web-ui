// @flow
import { createStore, applyMiddleware, type Store, combineReducers } from 'redux'
import createSagaMiddleware, { type SagaMiddleware, type Task } from 'redux-saga'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createBrowserHistory, type History } from 'history'
import { composeWithDevToolsDevelopmentOnly } from '@redux-devtools/extension'

import AppConfiguration from '_/config'
import OvirtApi from '_/ovirtapi'
import reducers from '_/reducers'
import { rootSaga } from '_/sagas'

import { addActiveRequest, delayedRemoveActiveRequest } from '_/actions'

const composeEnhancers: any = composeWithDevToolsDevelopmentOnly({
  actionsDenylist: ['ADD_ACTIVE_REQUEST', 'REMOVE_ACTIVE_REQUEST', 'DELAYED_REMOVE_ACTIVE_REQUEST'],
  maxAge: 100,
})

function initializeApiTransportListener (store: Store<any, any>) {
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
export default function configureStore (): Store<any, any> & { rootTask: Task<any>, history: History<> } {
  const sagaMiddleware: SagaMiddleware<any> = createSagaMiddleware({
    onError (error: Error) {
      console.error('Uncaught saga error (store.js): ', error)
    },
  })

  // history to use for the connected react-router
  const history: History<> = createBrowserHistory({
    basename: AppConfiguration.applicationURL,
  })

  const store: Store<any, any> = createStore(
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
  const rootTask: Task<any> = sagaMiddleware.run(rootSaga)

  return {
    ...store,
    rootTask,
    history,
  }
}
