// @flow

import { fromJS } from 'immutable'

import {
  SET_CONSOLE_OPTIONS,
  SET_SSH_KEY,
  SET_OPTION,
  LOAD_USER_OPTIONS,
  LOAD_USER_OPTIONS_IN_PROGRESS,
  LOAD_USER_OPTIONS_FINISHED,
} from '_/constants'
import { actionReducer } from './utils'
import { locale } from '_/intl'
import AppConfiguration from '_/config'
import type { UserOptionsType } from '_/ovirtapi/types'
import type { LoadUserOptionsActionType } from '_/actions/types'

const defaultOptions: UserOptionsType = {
  global: {
    updateRate: AppConfiguration.schedulerFixedDelayInSeconds,
    language: locale,
    showNotifications: true,
    notificationSnoozeDuration: AppConfiguration.notificationSnoozeDurationInMinutes,
  },
  ssh: undefined,
  lastTransactions: {},
  consoleOptions: {},
  loadingFinished: false,
}

const initialState = fromJS({ ...defaultOptions })

const options = actionReducer(initialState, {
  [SET_CONSOLE_OPTIONS] (clientState: any, { payload: { vmId, options } }: any): any {
    return clientState.setIn(['consoleOptions', vmId], options)
  },
  [LOAD_USER_OPTIONS_IN_PROGRESS]: (clientState: any, action: any) => {
    return clientState.setIn(['loadingFinished'], false)
  },
  [LOAD_USER_OPTIONS_FINISHED]: (clientState: any, action: any) => {
    return clientState.setIn(['loadingFinished'], true)
  },
  [LOAD_USER_OPTIONS]: (clientState: any, action: LoadUserOptionsActionType) => {
    const serverState = fromJS(action.payload.userOptions || {})

    const choosePrevIfNextUndefined = (prev, next, key) => {
      return next === undefined ? prev : next
    }

    const merged = clientState.mergeWith((client, server, key) => {
      if (key === 'global') {
        // choose server property if it exists
        // but fallback to client's defaults if missing
        return client.mergeWith(choosePrevIfNextUndefined, server)
      }

      if (['ssh', 'lastTransactions', 'consoleOptions', 'loadingFinished'].includes(key)) {
        return client
      }

      // overwrite all other properties
      return server
    }, serverState)

    return merged
  },
  [SET_OPTION] (state: any, { payload: { key, value } }: any): any {
    return state.setIn(key, fromJS(value))
  },
  [SET_SSH_KEY] (state: any, { payload: { key, id } }: any): any {
    return state.setIn(['ssh'], fromJS({ key: key || '', id }))
  },
})

export default options
export {
  initialState,
}
