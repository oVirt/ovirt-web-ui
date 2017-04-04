import { fromJS } from 'immutable'
import { actionReducer } from './utils'

const operatingSystems = actionReducer(fromJS({ operatingSystems: {}, loadInProgress: true }), {
  ADD_ALL_OS (state, { payload: { os } }) {
    const updates = {}
    os.forEach(os => {
      updates[os.id] = os
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['operatingSystems'], imUpdates)
  },
})

export default operatingSystems
