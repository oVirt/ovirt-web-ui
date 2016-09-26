import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import reducer from './reducers'

// create the saga middleware
export const sagaMiddleware = createSagaMiddleware()

// mount it on the Store
const store = createStore(
  reducer,
  applyMiddleware(sagaMiddleware)
)

export default store

/*
import { applyMiddleware, createStore } from 'redux' // compose
import reducer from './reducers'

// import { thunk } from './middlewares'
import createSagaMiddleware from 'redux-saga'

const createStoreWithMiddleware = applyMiddleware(
  thunk
)(createStore)

const store = createStoreWithMiddleware(reducer)

export default store
*/