import { fromJS } from 'immutable'

import {
  SET_STORAGE_DOMAIN_FILES,
  SET_STORAGE_DOMAINS,
} from '_/constants'
import { actionReducer } from './utils'
import { arrayToMap } from '_/helpers'

const initialState = fromJS({})

const storageDomainReducers = actionReducer(initialState, {
  [SET_STORAGE_DOMAINS] (state, { payload: { storageDomains } }) {
    return fromJS(arrayToMap(storageDomains, storageDomain => storageDomain.id))
  },
  [SET_STORAGE_DOMAIN_FILES] (state, { payload: { storageDomainId, files } }) {
    return state.setIn([storageDomainId, 'files'], files)
  },
})

export default storageDomainReducers
