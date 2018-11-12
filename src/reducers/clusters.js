import { fromJS } from 'immutable'

import { actionReducer } from './utils'
import { arrayToMap } from 'app-helpers'
import { SET_CLUSTERS } from 'app-constants'

const initialState = fromJS({})

const clusters = actionReducer(initialState, {
  [SET_CLUSTERS] (state, { payload: clusters }) {
    const idToCluster = arrayToMap(clusters, cluster => cluster.id)
    return fromJS(idToCluster)
  },
})

export default clusters
export {
  initialState,
}
