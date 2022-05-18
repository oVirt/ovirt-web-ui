// @flow
import * as Immutable from 'immutable'
import { fromJS } from 'immutable'
import {
  ADD_LAST_VM_EVENTS,
  ADD_USER_MESSAGE,
  ADD_VM_EVENTS,
  AUTO_ACKNOWLEDGE,
  DISMISS_USER_MSG,
  FAILED_EXTERNAL_ACTION,
  LOGIN_FAILED,
  SET_EVENT_SORT,
  SET_USERMSG_NOTIFIED,
  SET_SERVER_MESSAGES,
  SAVE_EVENT_FILTERS,
  CLEAR_USER_MSGS,
} from '_/constants'
import { actionReducer } from './utils'
import { toJS } from '_/helpers'
import uniqueId from 'lodash/uniqueId'

import type { FailedExternalActionType } from '_/actions/types'

function addLogEntry ({ state, message, type = 'ERROR', failedAction, messageDescriptor, titleDescriptor }: any): any {
  // TODO: use seq
  return state
    .update('records', records => records.unshift(Immutable.fromJS({
      id: uniqueId(),
      message,
      messageDescriptor,
      titleDescriptor,
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
  events: {},
  lastEvents: {},
  autoAcknowledge: false,
})

const userMessages: any = actionReducer(initialState, {
  // Log external action failures (i.e. AJAX calls) as user messages
  [FAILED_EXTERNAL_ACTION] (state: any, { payload: { message, messageDescriptor, titleDescriptor, type, failedAction } }: FailedExternalActionType): any {
    return addLogEntry({
      state,
      message,
      messageDescriptor,
      titleDescriptor,
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

  [ADD_VM_EVENTS] (state: any, { payload: { events, vmId } }: any): any {
    const allEvents = state.getIn(['events', vmId], fromJS([]))
    const all = allEvents.toJS().map(({ id }) => id)
    const filteredEvents = events.filter(({ id, ...rest }) => {
      if (all[id]) {
        console.warn('duplicate', id, rest)
      }
      return !all[id]
    })
    return state.setIn(['events', vmId], allEvents.concat(fromJS(filteredEvents)))
  },
  [ADD_LAST_VM_EVENTS] (state: any, { payload: { events, vmId } }: any): any {
    return state.setIn(['lastEvents', vmId], fromJS(events))
  },
  [SAVE_EVENT_FILTERS] (state: any, { payload: { filters } }: any): any {
    return state.setIn(['eventFilters'], fromJS(filters))
  },
  [SET_EVENT_SORT] (state: any, { payload: { sort } }: any): any {
    return state.setIn(['eventSort'], fromJS(sort))
  },

})

export default userMessages
