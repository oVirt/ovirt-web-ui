import { createStore, applyMiddleware, compose } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'

// create the saga middleware
export const sagaMiddleware = createSagaMiddleware()

const composeEnhancers =
  process.env.NODE_ENV !== 'production' &&
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose

// mount it on the Store
const store = createStore(
  reducer,
  composeEnhancers(
    applyMiddleware(sagaMiddleware)
  )
)

export default store
