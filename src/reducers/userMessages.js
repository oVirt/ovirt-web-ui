import Immutable from 'immutable'
import {
  CLEAR_USER_MSGS,
  FAILED_EXTERNAL_ACTION,
  LOGIN_FAILED,
} from '../constants'
import { actionReducer } from './utils'

function addLogEntry ({ state, message, type = 'ERROR', failedAction }) {
  // TODO: use seq
  return state
    .set('unread', true)
    .update('records', records => records.push({
      message,
      type,
      failedAction,
      time: Date.now(),
    }))
}

/**
 * The UserMessages reducer
 *
 * @param state
 * @param action
 * @returns {*}
 */

const initialState = Immutable.fromJS({
  records: [],
  unread: false,
  show: false,
})

const userMessages = actionReducer(initialState, {
  [FAILED_EXTERNAL_ACTION] (state, { payload: { message, shortMessage, type, action } }) { // see the vms() reducer
    return addLogEntry({
      state,
      message: message,
      shortMessage,
      type,
      failedAction: action,
    })
  },
  [LOGIN_FAILED] (state, { payload: { message, errorCode } }) {
    return addLogEntry({ state, message: message, type: errorCode })
  },
  [CLEAR_USER_MSGS] (state) {
    return state.set('unread', false).update('records', records => records.clear())
  },
})

export default userMessages
