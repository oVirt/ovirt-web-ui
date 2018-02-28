import { fromJS } from 'immutable'

import { SET_STORAGE_DOMAINS } from '../constants'
import { actionReducer } from './utils'

const initialState = fromJS([])

const storageDomainReducers = actionReducer(initialState, {
  [SET_STORAGE_DOMAINS] (store, { payload: { storageDomains } }) {
    return fromJS(storageDomains)
  },
})

export default storageDomainReducers
