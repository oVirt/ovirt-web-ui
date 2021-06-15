import Immutable from 'immutable'
import { actionReducer } from './utils'

import { DefaultEngineOptions } from '_/config'
import {
  APP_CONFIGURED,
  DEFAULT_ENGINE_OPTION_VERSION,
  LOGIN_FAILED,
  LOGIN_SUCCESSFUL,
  LOGOUT,
  REFRESH_DATA,
  SET_ADMINISTRATOR,
  SET_CPU_TOPOLOGY_OPTIONS,
  SET_CURRENT_PAGE,
  SET_DEFAULT_TIMEZONE,
  SET_GLOBAL_DEFAULT_CONSOLE,
  SET_GLOBAL_DEFAULT_VNC_MODE,
  SET_OVIRT_API_VERSION,
  SET_USB_AUTOSHARE,
  SET_USB_FILTER,
  SET_USER_FILTER_PERMISSION,
  SET_USER_GROUPS,
  SET_USER_SESSION_TIMEOUT_INTERVAL,
  SET_USER,
  SET_WEBSOCKET,
  SHOW_TOKEN_EXPIRED_MSG,
} from '_/constants'

import { toUiConsole } from '_/utils'

const initialState = Immutable.fromJS({
  lastRefresh: 0,
  oVirtApiVersion: {
    major: undefined,
    minor: undefined,
    passed: undefined,
  },
  blankTemplateId: '00000000-0000-0000-0000-000000000000', // "engine/api/" -> special_objects.blank_template.id

  loginToken: undefined,
  logoutWasManual: false,
  isTokenExpired: false,
  appConfigured: false,

  currentPage: {},
  user: {
    name: undefined,
    id: undefined,
  },
  userGroups: [],

  // allowed values: vnc, spice
  defaultConsole: DefaultEngineOptions.ClientModeConsoleDefault,
  // allowed values: Native, NoVnc
  defaultVncMode: DefaultEngineOptions.ClientModeVncDefault,
  // derrived from defaultConsole and defaultVncMode
  // allowed values: NativeVnc, BrowserVnc, spice, rdp
  defaultUiConsole: toUiConsole(DefaultEngineOptions.ClientModeVncDefault, DefaultEngineOptions.ClientModeConsoleDefault),

  filter: true,
  isFilterChecked: false,
  administrator: false,

  cpuOptions: {
    maxNumOfSockets: new Map([[ DEFAULT_ENGINE_OPTION_VERSION, DefaultEngineOptions.MaxNumOfVmSockets ]]),
    maxNumOfCores: new Map([[ DEFAULT_ENGINE_OPTION_VERSION, DefaultEngineOptions.MaxNumOfCpuPerSocket ]]),
    maxNumOfThreads: new Map([[ DEFAULT_ENGINE_OPTION_VERSION, DefaultEngineOptions.MaxNumOfThreadsPerCpu ]]),
    maxNumOfVmCpusPerArch: new Map([[ DEFAULT_ENGINE_OPTION_VERSION, DefaultEngineOptions.MaxNumOfVmCpusPerArch ]]),
  },

  usbAutoshare: DefaultEngineOptions.SpiceUsbAutoShare,
  usbFilter: DefaultEngineOptions.getUSBFilter,

  userSessionTimeoutInterval: DefaultEngineOptions.UserSessionTimeOutInterval,

  defaultGeneralTimezone: DefaultEngineOptions.DefaultGeneralTimeZone,
  defaultWindowsTimezone: DefaultEngineOptions.DefaultWindowsTimeZone,

  websocket: DefaultEngineOptions.WebSocketProxy,
})

const config = actionReducer(initialState, {
  [LOGIN_SUCCESSFUL] (state, { payload: { username, domain, token, userId } }) {
    return state.merge({
      loginToken: token,
      user: {
        name: username,
        id: userId,
      },
      domain,
    })
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
  [SET_USB_AUTOSHARE] (state, { payload: { usbAutoshare } }) {
    return state.set('usbAutoshare', usbAutoshare)
  },
  [SET_USB_FILTER] (state, { payload: { usbFilter } }) {
    return state.set('usbFilter', usbFilter)
  },
  [SET_WEBSOCKET] (state, { payload: { websocket } }) {
    return state.set('websocket', Immutable.fromJS(websocket))
  },
  [SET_USER] (state, { payload: { user } }) {
    return state.mergeDeep({ user })
  },
  [SET_GLOBAL_DEFAULT_CONSOLE] (state, { payload: { defaultConsole } }) {
    const defaultVncMode = state.get('defaultVncMode')

    return state.set('defaultConsole', defaultConsole)
      .set('defaultUiConsole', toUiConsole(defaultVncMode, defaultConsole))
  },
  [SET_GLOBAL_DEFAULT_VNC_MODE] (state, { payload: { defaultVncMode } }) {
    const defaultConsole = state.get('defaultConsole')
    return state.set('defaultVncMode', defaultVncMode)
      .set('defaultUiConsole', toUiConsole(defaultVncMode, defaultConsole))
  },
  [SET_USER_GROUPS] (state, { payload: { groups } }) {
    return state.set('userGroups', groups)
  },
  [SET_CURRENT_PAGE] (state, { payload }) {
    return state.set('currentPage', Object.assign({}, payload))
  },
  [SET_CPU_TOPOLOGY_OPTIONS] (state, { payload: {
    maxNumOfSockets,
    maxNumOfCores,
    maxNumOfThreads,
    maxNumOfVmCpusPerArch,
  } }) {
    return state.set('cpuOptions', Immutable.fromJS({
      maxNumOfSockets,
      maxNumOfCores,
      maxNumOfThreads,
      maxNumOfVmCpusPerArch,
    }))
  },
  [SET_DEFAULT_TIMEZONE] (state, { payload: {
    defaultGeneralTimezone,
    defaultWindowsTimezone,
  } }) {
    return state.merge({
      defaultGeneralTimezone,
      defaultWindowsTimezone,
    })
  },
  [REFRESH_DATA] (state) {
    return state.set('lastRefresh', Date.now())
  },
  [APP_CONFIGURED] (state) {
    return state.set('appConfigured', true)
  },
}, true)

export default config
export {
  initialState,
}
