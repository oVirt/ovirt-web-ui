import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createBrowserHistory } from 'history'

import AppConfiguration from './config'
import reducers from './reducers'

const composeEnhancers =
  (process.env.NODE_ENV !== 'production' &&
   window &&
   typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function' &&
   window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
     actionsBlacklist: ['ADD_ACTIVE_REQUEST', 'REMOVE_ACTIVE_REQUEST', 'DELAYED_REMOVE_ACTIVE_REQUEST'],
     maxAge: 100,
   })) ||
  compose

export default function configureStore () {
  const sagaMiddleware = createSagaMiddleware({
    onError (...args) {
      console.error('Uncaught saga error (store.js): ', ...args)
    },
  })

  // history to use for the connected react-router
  const history = createBrowserHistory({
    basename: AppConfiguration.applicationURL,
  })

  return {
    ...createStore(
      connectRouter(history)(reducers),
      composeEnhancers(
        applyMiddleware(
          routerMiddleware(history),
          sagaMiddleware
        )
      )
    ),
    runSaga: sagaMiddleware.run,
    history: history,
  }
}
