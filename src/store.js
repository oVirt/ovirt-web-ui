// @flow
import { createStore, applyMiddleware, type Store, combineReducers } from 'redux'
import createSagaMiddleware, { type SagaMiddleware, type Task } from 'redux-saga'
import { composeWithDevToolsDevelopmentOnly } from '@redux-devtools/extension'

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
 * Configure the app's redux store with saga middleware and the OvirtApi listeners.
 */
export default function configureStore (): Store<any, any> & { rootTask: Task<any> } {
  const sagaMiddleware: SagaMiddleware<any> = createSagaMiddleware({
    onError (error: Error) {
      console.error('Uncaught saga error (store.js): ', error)
    },
  })

  const store: Store<any, any> = createStore(
    combineReducers({
      ...reducers,
    }),
    composeEnhancers(
      applyMiddleware(
        sagaMiddleware
      )
    )
  )

  initializeApiTransportListener(store)
  const rootTask: Task<any> = sagaMiddleware.run(rootSaga)

  return {
    ...store,
    rootTask,
    // history,
  }
}
