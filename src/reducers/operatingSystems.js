import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems } from './utils'

const initialState = fromJS({
  operatingSystems: {},
  loadInProgress: true,
})
const operatingSystems = actionReducer(initialState, {
  ADD_ALL_OS (state, { payload: { os } }) {
    const updates = {}
    os.forEach(os => {
      updates[os.id] = os
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['operatingSystems'], imUpdates)
  },

  REMOVE_MISSING_OSS (state, { payload: { osIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'operatingSystems', idsToPreserve: osIdsToPreserve })
  },
})

export default operatingSystems
export {
  initialState,
}
