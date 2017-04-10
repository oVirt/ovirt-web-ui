import Immutable from 'immutable'
import {
  LOGIN_SUCCESSFUL,
  LOGIN_FAILED,
  LOGOUT,
  SET_OVIRT_API_VERSION,
} from '../constants'

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
  state = state || Immutable.fromJS({
    loginToken: undefined,
    user: {
      name: undefined,
    },
    oVirtApiVersion: {
      major: undefined,
      minor: undefined,
      passed: undefined,
    },
  })

  switch (action.type) {
    case LOGIN_SUCCESSFUL:
      return state.merge({ loginToken: action.payload.token, user: { name: action.payload.username } })
    case LOGIN_FAILED: // see the userMessages() reducer
      return logout({ state })
    case LOGOUT: // see the vms() reducer
      return logout({ state })
    case SET_OVIRT_API_VERSION:
      return state.merge({ oVirtApiVersion: action.payload.oVirtApiVersion })
    default:
      return state
  }
}

export default config
