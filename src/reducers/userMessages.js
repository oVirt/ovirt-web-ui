import Immutable from 'immutable'

function addLogEntry ({ state, message, type = 'ERROR', failedAction }) {
  // TODO: use seq
  return state.set('unread', true).update('records', records => records.push({
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
function userMessages (state, action) {
  state = state || Immutable.fromJS({ records: [], unread: false, show: false })

  switch (action.type) {
    case 'FAILED_EXTERNAL_ACTION': // see the vms() reducer
      return addLogEntry({
        state,
        message: action.payload.message,
        shortMessage: action.payload.shortMessage,
        type: action.payload.type,
        failedAction: action.payload.action,
      })
    case 'LOGIN_FAILED': // see the config() reducer
      return addLogEntry({ state, message: action.payload.message, type: action.payload.errorCode })
    case 'CLEAR_USER_MSGS':
      return state.set('unread', false).update('records', records => records.clear())
    default:
      return state
  }
}

export default userMessages
