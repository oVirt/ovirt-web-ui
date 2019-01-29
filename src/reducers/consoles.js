import Immutable from 'immutable'
import { SET_CONSOLE_IN_USE, SET_CONSOLE_LOGON, SET_CONSOLE_TICKETS, SET_CONSOLE_NVNC } from '_/constants'

import { actionReducer } from './utils'
import { SET_ACTIVE_CONSOLE } from '../constants'

const initialState = Immutable.fromJS({ vms: {} })

const consoles = actionReducer(initialState, {
  [SET_CONSOLE_IN_USE] (state, { payload: { vmId, consoleInUse } }) {
    return state.setIn(['vms', vmId, 'consoleInUse'], consoleInUse)
  },
  [SET_CONSOLE_LOGON] (state, { payload: { vmId, isLogon } }) {
    return state.setIn(['vms', vmId, 'isLogon'], isLogon)
  },
  [SET_CONSOLE_TICKETS] (state, { payload: { vmId, proxyTicket, ticket } }) {
    const tmpState = state.setIn(['vms', vmId, 'proxyTicket'], proxyTicket)
    return tmpState
      .setIn(['vms', vmId, 'ticket'], ticket)
  },
  [SET_ACTIVE_CONSOLE] (state, { payload: { vmId, consoleId } }) {
    return state.setIn(['vms', vmId, 'id'], consoleId)
  },
  [SET_CONSOLE_NVNC] (state, { payload: { vmId, isRunning } }) {
    return state.setIn(['vms', vmId, 'nvnc'], isRunning)
  },
})

export default consoles
export {
  initialState,
}
