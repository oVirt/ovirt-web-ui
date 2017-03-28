import Immutable from 'immutable'

function logout ({ state }) {
  // TODO: use seq
  return state.delete('loginToken').deleteIn(['user', 'name'])
}

/**
 * The Config reducer
 *
 * @param state
 * @param action
 * @returns {*}
 */
function config (state, action) {
  state = state || Immutable.fromJS({ loginToken: undefined, user: { name: undefined } })
  // logDebug(`The 'config' reducer action=${JSON.stringify(hidePassword({action}))}`)
  switch (action.type) {
    case 'LOGIN_SUCCESSFUL':
      return state.merge({ loginToken: action.payload.token, user: { name: action.payload.username } })
    case 'LOGIN_FAILED': // see the userMessages() reducer
      return logout({ state })
    case 'LOGOUT': // see the vms() reducer
      return logout({ state })
    default:
      return state
  }
}

export default config
