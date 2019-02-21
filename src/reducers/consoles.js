import Immutable from 'immutable'
import {
  SET_CONSOLE_TICKETS,
  SET_CONSOLE_NOVNC_STATUS,
  SET_NEW_CONSOLE_MODAL,
  CLOSE_CONSOLE_MODAL,
  SET_IN_USE_CONSOLE_MODAL_STATE,
  SET_LOGON_CONSOLE_MODAL_STATE,

  CONSOLE_OPENED,
  CONSOLE_IN_USE,
  CONSOLE_LOGON,
} from '_/constants'

import { actionReducer } from './utils'
import { SET_ACTIVE_CONSOLE } from '../constants'

const initialState = Immutable.fromJS({ vms: {}, modals: {} })

const consoles = actionReducer(initialState, {
  [SET_CONSOLE_TICKETS] (state, { payload: { vmId, proxyTicket, ticket } }) {
    const tmpState = state.setIn(['vms', vmId, 'proxyTicket'], proxyTicket)
    return tmpState
      .setIn(['vms', vmId, 'ticket'], ticket)
  },
  [SET_ACTIVE_CONSOLE] (state, { payload: { vmId, consoleId } }) {
    return state.setIn(['vms', vmId, 'id'], consoleId)
  },
  [SET_CONSOLE_NOVNC_STATUS] (state, { payload: { vmId, status } }) {
    return state.setIn(['vms', vmId, 'consoleStatus'], status)
  },
  [SET_NEW_CONSOLE_MODAL] (state, { payload: { modalId, vmId, consoleId } }) {
    const modal = {
      vmId,
      consoleId,
      state: CONSOLE_OPENED,
    }
    return state.setIn(['modals', modalId], Immutable.fromJS(modal))
  },
  [CLOSE_CONSOLE_MODAL] (state, { payload: { modalId } }) {
    return state.update('modals', modals => modals.delete(modalId))
  },
  [SET_IN_USE_CONSOLE_MODAL_STATE] (state, { payload: { modalId } }) {
    return state.setIn(['modals', modalId, 'state'], CONSOLE_IN_USE)
  },
  [SET_LOGON_CONSOLE_MODAL_STATE] (state, { payload: { modalId } }) {
    return state.setIn(['modals', modalId, 'state'], CONSOLE_LOGON)
  },
})

export default consoles
export {
  initialState,
}
