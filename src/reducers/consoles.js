import Immutable from 'immutable'
import { SET_CONSOLE_IN_USE, SET_CONSOLE_VALID } from '_/constants'

import { actionReducer } from './utils'

const initialState = Immutable.fromJS({ vms: {} })

const consoles = actionReducer(initialState, {
  [SET_CONSOLE_IN_USE] (state, { payload: { vmId, consoleInUse } }) {
    return state.setIn(['vms', vmId, 'consoleInUse'], consoleInUse)
  },
  [SET_CONSOLE_LOGON] (state, { payload: { vmId, isLogon } }) {
    return state.setIn(['vms', vmId, 'isLogon'], isLogon)
  },
})

export default consoles
export {
  initialState,
}
