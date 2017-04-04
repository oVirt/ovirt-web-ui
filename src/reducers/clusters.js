import { fromJS } from 'immutable'
import { actionReducer } from './utils'

const clusters = actionReducer(fromJS({ clusters: {}, loadInProgress: true }), {
  ADD_CLUSTERS (state, { payload: { clusters } }) {
    const updates = {}
    clusters.forEach(cluster => {
      updates[cluster.id] = cluster
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['clusters'], imUpdates)
  },
})

export default clusters
