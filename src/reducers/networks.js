import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems } from './utils'

const initialState = fromJS({
  networks: {},
  loadInProgress: true,
})

const networks = actionReducer(initialState, {
  ADD_NETWORKS (state, { payload: { networks } }) {
    const updates = {}
    networks.forEach(network => {
      updates[network.id] = network
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['networks'], imUpdates)
  },

  REMOVE_MISSING_NETWORKS (state, { payload: { networkIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'networks', idsToPreserve: networkIdsToPreserve })
  },
})

export default networks
