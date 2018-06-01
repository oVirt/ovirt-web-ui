import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems } from './utils'

const initialState = fromJS({
  hosts: {},
})

const hosts = actionReducer(initialState, {
  ADD_HOSTS (state, { payload: { hosts } }) {
    const updates = {}
    hosts.forEach(host => {
      updates[host.id] = host
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['hosts'], imUpdates)
  },

  REMOVE_MISSING_HOSTS (state, { payload: { hostIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'hosts', idsToPreserve: hostIdsToPreserve })
  },
})

export default hosts
