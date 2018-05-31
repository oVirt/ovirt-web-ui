import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems } from './utils'

const initialState = fromJS({
  clusters: {},
  loadInProgress: true,
})

const clusters = actionReducer(initialState, {
  ADD_CLUSTERS (state, { payload: { clusters } }) {
    const updates = {}
    clusters.forEach(cluster => {
      updates[cluster.id] = cluster
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['clusters'], imUpdates)
  },

  REMOVE_MISSING_CLUSTERS (state, { payload: { clusterIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'clusters', idsToPreserve: clusterIdsToPreserve })
  },
})

export default clusters
export {
  initialState,
}
