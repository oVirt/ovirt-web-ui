import { Set } from 'immutable'

import { actionReducer } from './utils'
import { ADD_ACTIVE_REQUEST, REMOVE_ACTIVE_REQUEST } from '../constants'

const initialState = new Set()

const clusters = actionReducer(initialState, {
  [ADD_ACTIVE_REQUEST] (state, { payload: requestId }) {
    return state.add(requestId)
  },

  [REMOVE_ACTIVE_REQUEST] (state, { payload: requestId }) {
    return state.delete(requestId)
  },
})

export default clusters
