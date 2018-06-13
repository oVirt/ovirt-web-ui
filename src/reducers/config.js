import Immutable from 'immutable'
import { actionReducer } from './utils'
import {
  LOGIN_FAILED,
  LOGIN_SUCCESSFUL,
  LOGOUT,
  SET_ADMINISTRATOR,
  SET_DOMAIN,
  SET_OVIRT_API_VERSION,
  SET_USB_FILTER,
  SET_USER_FILTER_PERMISSION,
  SHOW_TOKEN_EXPIRED_MSG,
} from '../constants'

const initialState = Immutable.fromJS({
  loginToken: undefined,
  isTokenExpired: false,
  user: {
    name: undefined,
    id: undefined,
  },
  oVirtApiVersion: {
    major: undefined,
    minor: undefined,
    passed: undefined,
  },
  filter: true,
  isFilterChecked: false,
  administrator: false,
  usbFilter: null,
})

const config = actionReducer(initialState, {
  [LOGIN_SUCCESSFUL] (state, { payload: { token, username, userId } }) {
    return state.merge({ loginToken: token, user: { name: username, id: userId } })
  },
  [LOGIN_FAILED] (state) {
    return state.delete('loginToken').deleteIn(['user', 'name'])
  },
  [LOGOUT] (state) {
    return state.delete('loginToken').deleteIn(['user', 'name'])
  },
  [SET_OVIRT_API_VERSION] (state, { payload: { oVirtApiVersion } }) {
    return state.merge({ oVirtApiVersion: oVirtApiVersion })
  },
  [SET_USER_FILTER_PERMISSION] (state, { payload: { filter } }) {
    return state.set('filter', filter).set('isFilterChecked', true)
  },
  [SET_ADMINISTRATOR] (state, { payload: { administrator } }) {
    return state.set('administrator', administrator)
  },
  [SHOW_TOKEN_EXPIRED_MSG] (state) {
    return state.set('isTokenExpired', true)
  },
  [SET_DOMAIN] (state, { payload: { domain } }) {
    return state.set('domain', domain)
  },
  [SET_USB_FILTER] (state, { payload: { usbFilter } }) {
    return state.set('usbFilter', usbFilter)
  },
}, true)

export default config
