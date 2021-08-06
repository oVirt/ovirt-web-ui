// @flow

import produce from 'immer'
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

const consoles = actionReducer(initialState, {
  [SET_CONSOLE_TICKETS]: produce((draft: any, { payload: { vmId, proxyTicket, ticket } }: any): any => {
    draft.vms[vmId] = {
      ...draft.vms[vmId],
      ticket,
      proxyTicket,
    }
  }),
  [SET_CONSOLE_STATUS]: produce((draft: any, { payload: { vmId, status, reason, consoleType } }: any): any => {
    draft.vms[vmId] = {
      ...draft.vms[vmId],
      [consoleType]: {
        status,
        reason,
      },
    }
  }),
  [ADD_CONSOLE_ERROR]: produce((draft: any, {
    payload: {
      vmId,
      vmName,
      consoleType,
      status,
      consoleId,
    },
  }: any): any => {
    draft.errors.push({ vmId, vmName, consoleType, status, consoleId })
  }),
  [DISMISS_CONSOLE_ERROR]: produce((draft: any, {
    payload: {
      vmId,
      consoleType,
    },
  }: any): any => {
    draft.errors = draft.errors.filter(({ vmId: id, consoleType: type }) => id !== vmId || type !== consoleType)
  }),

})

export default consoles
export {
  initialState,
}
