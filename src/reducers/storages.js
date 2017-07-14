import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems } from './utils'

const initialState = fromJS({
  storages: {},
  loadInProgress: true,
})

const storages = actionReducer(initialState, {
  SET_STORAGES (state, { payload: { storages } }) {
    const updates = {}
    storages.forEach(storage => {
      updates[storage.id] = storage
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['storages'], imUpdates)
  },

  SET_FILES (state, { payload: { storageId, files } }) {
    return state.setIn(['storages', storageId, 'files'], files)
  },

  REMOVE_MISSING_STORAGES (state, { payload: { storageIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'storages', idsToPreserve: storageIdsToPreserve })
  },
})

export default storages
