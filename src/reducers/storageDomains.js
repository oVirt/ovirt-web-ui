import { fromJS } from 'immutable'

import { SET_STORAGE_DOMAINS, ADD_STORAGE_DOMAINS, SET_STORAGE_DOMAIN_FILES } from '../constants'
import { actionReducer } from './utils'
import { arrayToMap } from '../helpers'

const initialState = fromJS({})

function addStorageDomain (state, storageDomain) {
  const existingStorageDomain = state.get(storageDomain.id)
  if (existingStorageDomain) {
    const mergedStatuses =
      Object.assign({}, existingStorageDomain.get('statusPerDataCenter').toJS(), storageDomain.statusPerDataCenter)
    storageDomain.statusPerDataCenter = mergedStatuses
  }
  return state.set(storageDomain.id, fromJS(storageDomain))
}

const storageDomainReducers = actionReducer(initialState, {
  [SET_STORAGE_DOMAINS] (state, { payload: { storageDomains } }) {
    return fromJS(arrayToMap(storageDomains, storageDomain => storageDomain.id))
  },
  [ADD_STORAGE_DOMAINS] (state, { payload: storageDomains }) {
    return storageDomains.reduce(addStorageDomain, state)
  },
  [SET_STORAGE_DOMAIN_FILES] (state, { payload: { storageDomainId, files } }) {
    return state.setIn([storageDomainId, 'files'], files)
  },
})

export default storageDomainReducers
