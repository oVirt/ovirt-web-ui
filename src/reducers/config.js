import Immutable from 'immutable'
import { actionReducer } from './utils'
import {
  LOGIN_FAILED,
  LOGIN_SUCCESSFUL,
  LOGOUT,
  SET_ADMINISTRATOR,
  SET_CURRENT_PAGE,
  SET_DOMAIN,
  SET_CPU_TOPOLOGY_OPTIONS,
  SET_OVIRT_API_VERSION,
  SET_USB_FILTER,
  SET_USER_FILTER_PERMISSION,
  SET_USER_GROUPS,
  SET_USER_SESSION_TIMEOUT_INTERVAL,
  SET_WEBSOCKET,
  SHOW_TOKEN_EXPIRED_MSG,
} from '_/constants'

const initialState = Immutable.fromJS({
  loginToken: undefined,
  logoutWasManual: false,
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
  userSessionTimeoutInterval: null,
  usbFilter: null,
  userGroups: [],
  currentPage: {},
  maxNumberOfSockets: 16,
  maxNumberOfCores: 254,
  maxNumberOfThreads: 8,
  maxNumOfVmCpus: 1,
  websocket: null,
  blankTemplateId: '00000000-0000-0000-0000-000000000000', // "engine/api/" -> special_objects.blank_template.id
})

const config = actionReducer(initialState, {
  [LOGIN_SUCCESSFUL] (state, { payload: { token, username, userId } }) {
    return state.merge({ loginToken: token, user: { name: username, id: userId } })
  },
  [LOGIN_FAILED] (state) {
    return state.delete('loginToken').deleteIn(['user', 'name'])
  },
  [LOGOUT] (state, { payload: { isManual } }) {
    return state
      .delete('loginToken')
      .deleteIn(['user', 'name'])
      .set('logoutWasManual', isManual)
  },
  [SET_OVIRT_API_VERSION] (state, { payload: { oVirtApiVersion } }) {
    return state.merge({ oVirtApiVersion: oVirtApiVersion })
  },
  [SET_USER_FILTER_PERMISSION] (state, { payload: { filter } }) {
    return state.set('filter', filter).set('isFilterChecked', true)
  },
  [SET_USER_SESSION_TIMEOUT_INTERVAL] (state, { payload: { userSessionTimeoutInterval } }) {
    return state.set('userSessionTimeoutInterval', userSessionTimeoutInterval * 60)
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
  [SET_WEBSOCKET] (state, { payload: { websocket } }) {
    return state.set('websocket', Immutable.fromJS(websocket))
  },
  [SET_USER_GROUPS] (state, { payload: { groups } }) {
    return state.set('userGroups', groups)
  },
  [SET_CURRENT_PAGE] (state, { payload }) {
    return state.set('currentPage', Object.assign({}, payload))
  },
  [SET_CPU_TOPOLOGY_OPTIONS] (state, { payload: {
    maxNumberOfSockets,
    maxNumOfVmCpus,
    maxNumberOfCores,
    maxNumberOfThreads,
  } }) {
    return state
      .set('maxNumberOfSockets', maxNumberOfSockets)
      .set('maxNumberOfCores', maxNumberOfCores)
      .set('maxNumberOfThreads', maxNumberOfThreads)
      .set('maxNumOfVmCpus', maxNumOfVmCpus)
  },
}, true)

export default config
export {
  initialState,
}
