// @flow
import * as Immutable from 'immutable'
import {
  ADD_USER_MESSAGE,
  AUTO_ACKNOWLEDGE,
  DISMISS_USER_MSG,
  FAILED_EXTERNAL_ACTION,
  LOGIN_FAILED,
  SET_USERMSG_NOTIFIED,
  SET_SERVER_MESSAGES,
  CLEAR_USER_MSGS,
} from '_/constants'
import { actionReducer } from './utils'
import { toJS } from '_/helpers'
import uniqueId from 'lodash/uniqueId'

import type { FailedExternalActionType } from '_/actions/types'

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

function removeEvents (targetIds: Set<string>, state: any): any {
  return state.update('records', records => records.filter(record => !targetIds.has(record.get('id'))))
}

const initialState = Immutable.fromJS({
  records: [],
  autoAcknowledge: false,
})

const userMessages: any = actionReducer(initialState, {
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
  [CLEAR_USER_MSGS] (state: any, { payload: { records } }: any): any {
    // remove only events visible on the UI when user truggered the action
    return removeEvents(new Set(records.map(({ id }) => id)), state)
  },

  [SET_SERVER_MESSAGES] (state: any, { payload: { messages } }: any): any {
    const existingServerEvents = toJS(state.get('records', []))
      .filter(({ source }) => source === 'server')
    // replace existing server events
    let newState = removeEvents(new Set(existingServerEvents.map(({ id }) => id)), state)
    for (const message of messages) {
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
    return removeEvents(new Set([eventId]), state)
  },

  [AUTO_ACKNOWLEDGE] (state: any, { payload: { autoAcknowledge = false } }: any): any {
    return state.set('autoAcknowledge', autoAcknowledge)
  },

})

export default userMessages
