import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems } from './utils'

const initialState = fromJS({
  vnicProfiles: {},
  loadInProgress: true,
})

const vnicProfiles = actionReducer(initialState, {
  ADD_VNIC_PROFILES (state, { payload: { vnicProfiles } }) {
    const updates = {}
    vnicProfiles.forEach(vnicProfile => {
      updates[vnicProfile.id] = vnicProfile
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['vnicProfiles'], imUpdates)
  },

  REMOVE_MISSING_VNIC_PROFILES (state, { payload: { vnicProfileIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'vnicProfiles', idsToPreserve: vnicProfileIdsToPreserve })
  },
})

export default vnicProfiles
