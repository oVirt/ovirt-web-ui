// @flow
import * as Immutable from 'immutable'
import {
  ADD_USER_MESSAGE,
  AUTO_ACKNOWLEDGE,
  DISMISS_USER_MSG,
  FAILED_EXTERNAL_ACTION,
  LOGIN_FAILED,
  SET_USERMSG_NOTIFIED,
  SET_USER_MESSAGES,
} from '_/constants'
import { actionReducer } from './utils'
import uniqueId from 'lodash/uniqueId'

import type { FailedExternalActionType } from '_/actions'

function addLogEntry ({ state, message, type = 'ERROR', failedAction, messageDescriptor }: any): any {
  // TODO: use seq
  return state
    .update('records', records => records.unshift(Immutable.fromJS({
      id: uniqueId(),
      message,
      messageDescriptor,
      type,
      failedAction,
      time: Date.now(),
      notified: state.get('autoAcknowledge'),
      source: 'local',
    })))
}

const initialState = Immutable.fromJS({
  records: [],
  autoAcknowledge: false,
})

const userMessages = actionReducer(initialState, {
  // Log external action failures (i.e. AJAX calls) as user messages
  [FAILED_EXTERNAL_ACTION] (state: any, { payload: { message, messageDescriptor, type, failedAction } }: FailedExternalActionType): any {
    return addLogEntry({
      state,
      message,
      messageDescriptor,
      type,
      failedAction,
    })
  },
  [LOGIN_FAILED] (state: any, { payload: { message, errorCode } }: any): any {
    return addLogEntry({ state, message: message, type: errorCode })
  },

  [ADD_USER_MESSAGE] (state: any, { payload: { message, messageDescriptor, type = 'INFO' } }: any): any {
    return addLogEntry({
      state, message, messageDescriptor, type,
    })
  },

  [SET_USER_MESSAGES] (state: any, { payload: { messages } }: any): any {
    let newState = state.update('records', records => records.clear())
    for (let message of messages) {
      newState = newState.update('records', records => records.push(Immutable.fromJS({
        id: message.id,
        message: message.description,
        type: message.severity.toUpperCase(),
        time: message.time,
        notified: true,
        source: 'server',
      })))
    }
    return newState
  },

  [SET_USERMSG_NOTIFIED] (state: any, { payload: { eventId } }: any): any {
    return state.setIn(['records', state.get('records').findIndex(r => r.get('id') === eventId), 'notified'], true)
  },

  [DISMISS_USER_MSG] (state: any, { payload: { eventId } }: any): any {
    return state.update('records', records => records.delete(state.get('records').findIndex(r => r.get('id') === eventId)))
  },

  [AUTO_ACKNOWLEDGE] (state: any, { payload: { autoAcknowledge = false } }: any): any {
    return state.set('autoAcknowledge', autoAcknowledge)
  },

})

export default userMessages
