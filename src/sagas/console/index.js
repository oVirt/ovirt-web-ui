import {
  takeEvery,
  put,
  select,
  call,
} from 'redux-saga/effects'

import Api from '_/ovirtapi'
import OptionsManager from '_/optionsManager'
import { fileDownload, toJS } from '_/helpers'
import { doesVmSessionExistForUserId, idFromType } from '_/utils'
import * as Actions from '_/actions'

import { callExternalAction } from '../utils'
import {
  fetchVmSessions,
  fetchAndPutSingleVm,
} from '../index'

import { adjustVVFile } from './vvFileUtils'
import RDPBuilder from './rdpBuilder'

import { push } from 'connected-react-router'
import * as C from '_/constants'
import { canConsole, statusToTooltipId } from '_/vm-status'
import { getConsoles } from '_/utils/console'

// ----- Connection files
/**
 * Push a virt-viewer connection file (__console.vv__) to connect a user to a VM's console
 */
function* downloadOrOpenVmConsole ({
  vmName,
  consoleType,
  vmId,
  consoleId,
  usbAutoshare,
  usbFilter,
  hasGuestAgent,
  skipSSO,
  openInPage,
  logoutOtherUsers,
}) {
  if (hasGuestAgent && !skipSSO) {
    const result = yield callExternalAction(Api.vmLogon, { payload: { vmId } }, true)
    if (!result || result.status !== 'complete') {
      const message = result?.error?.responseJSON?.fault?.detail ?? ''
      yield put(Actions.addConsoleError({ vmId, vmName, consoleType, status: C.CONSOLE_LOGON, consoleId, logoutOtherUsers }))
      yield put(Actions.addUserMessage({ messageDescriptor: { id: 'cantOpenConsole', params: { message } }, type: 'error' }))
      return
    }
  }

  yield put(Actions.dismissConsoleError({ vmId, consoleType }))

  let data = yield callExternalAction(Api.console, { type: 'INTERNAL_CONSOLE', payload: { vmId, consoleId } })
  if (data.error) {
    return
  }

  const isSpice = consoleType === C.SPICE
  if (consoleType === C.NATIVE_VNC || isSpice) {
    const legacyOptions = getLegacyOptions({ vmId })
    const options = isSpice
      ? yield getSpiceConsoleOptions({ legacyOptions, usbAutoshare, usbFilter, vmId })
      : yield getVncOptions({ legacyOptions })

    data = adjustVVFile({ data, options })
    fileDownload({ data, fileName: 'console.vv', mimeType: 'application/x-virt-viewer' })
    yield put(Actions.setConsoleStatus({ vmId, status: C.DOWNLOAD_CONSOLE, consoleType }))
  }

  const isNoVNC = consoleType === C.BROWSER_VNC
  if (isNoVNC) {
    const dataTicket = yield callExternalAction(Api.consoleProxyTicket,
      { type: 'INTRENAL_CONSOLE', payload: { vmId, consoleId } })
    const ticket = yield callExternalAction(Api.consoleTicket,
      { type: 'INTRENAL_CONSOLE', payload: { vmId, consoleId } })
    yield put(Actions.setConsoleTickets({ vmId, proxyTicket: dataTicket.proxy_ticket.value, ticket: ticket.ticket }))
    yield put(Actions.setConsoleStatus({ vmId, status: C.INIT_CONSOLE, consoleType }))
  }

  if (openInPage || isNoVNC) {
    yield put(push('/vm/' + vmId + '/console/' + consoleType))
  }
}

/**
 * Legacy options were saved in browser's local storage.
 * The UI for setting theose options was removed in previous versions.
 * However there is still a (small) chance that the data is still there.
 * Note that legacy options are per VM and therefore should overwrite global defaults.
 */
function* getLegacyOptions ({ vmId }) {
  const options = yield select(state => state.options.getIn(['options', 'consoleOptions', vmId]))
  if (options) {
    return (options.toJS && options.toJS()) || options
  }
  console.log('console options not yet present, trying to load from local storage')
  yield getConsoleOptions(Actions.getConsoleOptions({ vmId }))
}

function* getSpiceConsoleOptions ({ legacyOptions, usbAutoshare, usbFilter, vmId }) {
  const smartcardEnabledOnVm = yield select(({ vms }) => vms.getIn(['vms', vmId, 'display', 'smartcardEnabled']))
  const newOptions = yield select(({ options, vms }) => ({
    fullscreen: options.getIn(['remoteOptions', 'fullScreenSpice', 'content']),
    ctrlAltDelToEnd: options.getIn(['remoteOptions', 'ctrlAltEndSpice', 'content']),
    smartcardEnabled: options.getIn(['remoteOptions', 'smartcardSpice', 'content']),
  }))

  const merged = {
    ...newOptions,
    ...legacyOptions,
    usbFilter,
    usbAutoshare,
  }
  merged.smartcardEnabled = smartcardEnabledOnVm && merged.smartcardEnabled
  return merged
}

function* getVncOptions ({ legacyOptions }) {
  const newOptions = yield select(({ options }) => ({
    fullscreen: options.getIn(['remoteOptions', 'fullScreenVnc', 'content']),
    ctrlAltDelToEnd: options.getIn(['remoteOptions', 'ctrlAltEndVnc', 'content']),
  }))
  return {
    ...newOptions,
    ...legacyOptions,
  }
}

/**
 * Push a RDP connection file (__console.rdp__) to connect a user to the Windows VM's RDP session
 */
function* getRDPVm ({
  openInPage,
  vmId,
  vmName,
  fqdn,
  username,
  domain,
}) {
  const rdpBuilder = new RDPBuilder({ username, domain, fqdn, vmName })
  const data = rdpBuilder.buildRDP()
  fileDownload({ data, fileName: 'console.rdp', mimeType: 'application/rdp' })
  yield put(Actions.setConsoleStatus({ vmId, status: C.DOWNLOAD_CONSOLE, consoleType: C.RDP }))
  if (openInPage) {
    yield put(push('/vm/' + vmId + '/console/rdp'))
  }
}

// -----

/**
 * Check the sessions on a VM and if someone other then the given user has an open
 * console, flag the console as "in use" requiring manual confirmation to open the
 * console (which will disconnect the other user's existing session).
 */
export function* openConsole ({
  payload: {
    consoleType,
    vmId,
    openInPage,
    skipSSO,
    logoutOtherUsers,
  },
}) {
  yield put(Actions.setConsoleStatus({ vmId, status: C.OPEN_IN_PROGRESS, consoleType }))

  const {
    userId,
    usbAutoshare,
    usbFilter,
    vmName,
    hasGuestAgent,
    consoleId,
    fqdn,
    domain,
    username,
  } = yield select(({ config, vms }) => ({
    usbAutoshare: config.get('usbAutoshare'),
    usbFilter: config.get('usbFilter'),
    userId: config.getIn(['user', 'id']),
    domain: config.get('domain'),
    username: config.getIn(['user', 'name']),
    vmName: vms.getIn(['vms', vmId, 'name']),
    hasGuestAgent: vms.getIn(['vms', vmId, 'ssoGuestAgent']),
    consoleId: idFromType({ consoleType, vm: vms.getIn(['vms', vmId]) }),
    fqdn: vms.getIn(['vms', vmId, 'fqdn']),
  }))

  if (consoleType === C.RDP) {
    yield call(getRDPVm, {
      openInPage,
      vmId,
      vmName,
      fqdn,
      username,
      domain,
    })
    return
  }

  const sessionsInternal = yield fetchVmSessions({ vmId })
  const consoleUsers = sessionsInternal && sessionsInternal
    .filter(session => session.consoleUser)
    .map(session => session.user)
  yield put(Actions.setVmSessions({ vmId, sessions: sessionsInternal }))

  if (!logoutOtherUsers && consoleUsers.length > 0 && consoleUsers.find(user => user.id === userId) === undefined) {
    yield put(Actions.addConsoleError({
      vmId,
      vmName,
      consoleType,
      status: C.CONSOLE_IN_USE,
      consoleId,
    }))
  } else {
    yield call(downloadOrOpenVmConsole, {
      vmName,
      consoleType,
      vmId,
      usbAutoshare,
      usbFilter,
      hasGuestAgent,
      consoleId,
      openInPage,
      skipSSO: skipSSO || doesVmSessionExistForUserId(sessionsInternal, userId),
      logoutOtherUsers,
    })
  }
}

// ----- Console Options (per VM) held by `OptionsManager`
export function* getConsoleOptions (action) {
  const options = OptionsManager.loadConsoleOptions(action.payload)
  yield put(Actions.setConsoleOptions({ vmId: action.payload.vmId, options }))
  return options
}

export function* saveConsoleOptions (action) {
  OptionsManager.saveConsoleOptions(action.payload)
  yield getConsoleOptions(Actions.getConsoleOptions({ vmId: action.payload.vmId }))
}

function cannotOpenConsole ({ id, params }) {
  return {
    messageDescriptor: {
      id: 'cantOpenConsole',
      params: {
        message: {
          id,
          params,
        },
      },
    },
    type: 'error',
  }
}

function* autoconnect () {
  // edge case: if user started VM Portal with a direct link to console/BrowserVnc screen then
  // a console is already being loaded. There is no point to autoconnect to another(or the same) console.
  // NOTE the check is low level because page router is starting in parallel (config.currentPage is not valid yet)
  if (window?.location?.pathname.endsWith?.(C.BROWSER_VNC)) {
    return
  }

  const {
    userId,
    firstLogin,
    websocket,
    defaultVncMode,
    preferredConsole,
    autoconnectOption,
  } = yield select(({ config, options }) => ({
    userId: config.getIn(['user', 'id']),
    firstLogin: config.getIn(['user', 'firstLogin'], true),
    websocket: config.get('websocket'),
    defaultVncMode: config.get('defaultVncMode'),
    preferredConsole: options.getIn(['remoteOptions', 'preferredConsole', 'content'], config.getIn(['defaultUiConsole'])),
    autoconnectOption: toJS(options.getIn(['remoteOptions', 'autoconnect'])),
  }))

  if (!firstLogin) {
    console.warn('Autoconnect aborted - page refresh detected')
    return
  }

  const { content: vmId, id: optionId } = autoconnectOption || {}

  if (!vmId) {
    return
  }

  const { internalVm: vm, error } = yield call(fetchAndPutSingleVm, Actions.getSingleVm({ vmId, shallowFetch: true }))
  if (error === 404) {
    yield put(Actions.deleteUserOption({ optionId, userId }))
    yield put(Actions.addUserMessage({ messageDescriptor: { id: 'clearAutoconnectVmNotAvailable' }, type: 'INFO' }))
    return
  }

  if (!vm || error) {
    yield put(Actions.addUserMessage(cannotOpenConsole({ id: 'apiConnectionFailed' })))
    return
  }

  if (!canConsole(vm.status)) {
    yield put(Actions.addUserMessage(cannotOpenConsole(statusToTooltipId[vm.status] ?? statusToTooltipId.__default__)))
    return
  }

  const consoles = getConsoles({
    vmConsoles: vm?.consoles ?? [],
    vmOsType: vm?.os?.type,
    websocket,
    defaultVncMode,
    preferredConsole,
  })
  if (!consoles.length) {
    yield put(Actions.addUserMessage(cannotOpenConsole({ id: 'consoleNotAvailableHeadless', params: { vmName: vm.name } })))
    return
  }

  const [{ consoleType }] = consoles

  yield put(Actions.openConsole({ consoleType, vmId }))
}

export default [
  takeEvery(C.GET_CONSOLE_OPTIONS, getConsoleOptions),
  takeEvery(C.SAVE_CONSOLE_OPTIONS, saveConsoleOptions),
  takeEvery(C.OPEN_CONSOLE, openConsole),
  takeEvery(C.APP_CONFIGURED, autoconnect),
]
