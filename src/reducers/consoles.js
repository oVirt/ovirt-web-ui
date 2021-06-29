// @flow

import * as Immutable from 'immutable'
import {
  SET_CONSOLE_TICKETS,
  SET_CONSOLE_STATUS,
  ADD_CONSOLE_ERROR,
  DISMISS_CONSOLE_ERROR,
} from '_/constants'

import { actionReducer } from './utils'
import type { ConsoleErrorType, VmConsoleType } from '_/ovirtapi/types'

const initialState: {
  errors: Array<ConsoleErrorType>,
  vms: {
    [vmId: string]: VmConsoleType
  }
} = {
  errors: [],
  vms: {
  },
}

const consoles = actionReducer(Immutable.fromJS(initialState), {
  [SET_CONSOLE_TICKETS] (state: any, { payload: { vmId, proxyTicket, ticket } }: any): any {
    return state
      .setIn(['vms', vmId, 'ticket'], ticket)
      .setIn(['vms', vmId, 'proxyTicket'], proxyTicket)
  },
  [SET_CONSOLE_STATUS] (state: any, { payload: { vmId, status, reason, consoleType } }: any): any {
    return state.setIn(['vms', vmId, consoleType], Immutable.fromJS({ status, reason }))
  },
  [ADD_CONSOLE_ERROR] (state: any, {
    payload: {
      vmId,
      vmName,
      consoleType,
      status,
      consoleId,
    },
  }: any): any {
    return state.update('errors', errors => errors.push(Immutable.fromJS({ vmId, vmName, consoleType, status, consoleId })))
  },
  [DISMISS_CONSOLE_ERROR] (state: any, {
    payload: {
      vmId,
      consoleType,
    },
  }: any): any {
    return state.update('errors', errors => errors.filterNot(error => error.get('vmId') === vmId && error.get('consoleType') === consoleType))
  },
})

export default consoles
export {
  initialState,
}
