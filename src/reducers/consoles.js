import Immutable from 'immutable'
import { SET_CONSOLE_IN_USE } from '../constants'

export function reducer (state, action) {
  state = state || Immutable.fromJS({ vms: {} })

  switch (action.type) {
    case SET_CONSOLE_IN_USE:
      return state.setIn(['vms', action.payload.vmId, 'consoleInUse'], action.payload.consoleInUse)
    default:
      return state
  }
}
