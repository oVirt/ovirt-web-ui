import Immutable from 'immutable'
import { actionReducer } from './utils'

const initialState = Immutable.fromJS({
  loginToken: undefined,
  user: {
    name: undefined,
  },
  oVirtApiVersion: {
    major: undefined,
    minor: undefined,
    passed: undefined,
  },
  filter: true,
  administrator: false,
})

const config = actionReducer(initialState, {
  LOGIN_SUCCESSFUL (state, { payload: { token, username } }) {
    return state.merge({ loginToken: token, user: { name: username } })
  },
  LOGIN_FAILED (state) {
    return state.delete('loginToken').deleteIn(['user', 'name'])
  },
  LOGOUT (state) {
    return state.delete('loginToken').deleteIn(['user', 'name'])
  },
  SET_OVIRT_API_VERSION (state, { payload: { oVirtApiVersion } }) {
    return state.merge({ oVirtApiVersion: oVirtApiVersion })
  },
  SET_USER_FILTER_PERMISSION (state, { payload: { filter } }) {
    return state.set('filter', filter)
  },
  SET_ADMINISTATOR (state, { payload: { administrator } }) {
    return state.set('administrator', administrator)
  },
})

export default config
