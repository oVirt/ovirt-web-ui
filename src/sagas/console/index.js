import { put, select } from 'redux-saga/effects'

import Api from '_/ovirtapi'
import OptionsManager from '_/optionsManager'
import { fileDownload } from '_/helpers'
import { doesVmSessionExistForUserId } from '_/utils'
import {
  downloadConsole,
  getConsoleOptions as getConsoleOptionsAction,
  setConsoleOptions,
  setVmSessions,
  setConsoleStatus,
  setConsoleTickets,
  setInUseConsoleModalState,
  setLogonConsoleModalState,
  closeConsoleModal,
  setNewConsoleModal,
  addUserMessage,
} from '_/actions'

import { callExternalAction } from '../utils'
import { fetchVmSessions } from '../index'

import { adjustVVFile } from './vvFileUtils'
import RDPBuilder from './rdpBuilder'

import { push } from 'connected-react-router'
import { setActiveConsole } from '../../actions'
import { INIT_CONSOLE, DOWNLOAD_CONSOLE } from '_/constants'

// ----- Connection files
/**
 * Push a virt-viewer connection file (__console.vv__) to connect a user to a VM's console
 */
export function* downloadVmConsole (action) {
  let { modalId, vmId, consoleId, usbAutoshare, usbFilter, hasGuestAgent, skipSSO, openInPage, isNoVNC } = action.payload

  if (hasGuestAgent && !skipSSO) {
    let result = yield callExternalAction('vmLogon', Api.vmLogon, { payload: { vmId } }, true)
    if (!result || result.status !== 'complete') {
      const {
        error: {
          responseJSON: {
            fault: {
              detail:
                message = '',
            } = {},
          } = {},
        } = {},
      } = result
      yield put(setLogonConsoleModalState({ modalId }))
      yield put(addUserMessage({ messageDescriptor: { id: 'cantOpenConsole', params: { message } }, type: 'error' }))
      return
    }
  }

  yield put(closeConsoleModal({ modalId }))

  let data = yield callExternalAction('console', Api.console, { type: 'INTERNAL_CONSOLE', payload: { vmId, consoleId } })
  if (data.error === undefined) {
    yield put(setActiveConsole({ vmId, consoleId }))
    /**
     *Download console if type is spice or novnc is running already
     */
    const isSpice = data.indexOf('type=spice') > -1
    if (isSpice || !isNoVNC) {
      const legacyOptions = getLegacyOptions({ vmId })
      const options = isSpice
        ? yield getSpiceConsoleOptions({ legacyOptions, usbAutoshare, usbFilter, vmId })
        : yield getVncOptions({ legacyOptions })

      data = adjustVVFile({ data, options })
      fileDownload({ data, fileName: `console.vv`, mimeType: 'application/x-virt-viewer' })
      yield put(setConsoleStatus({ vmId, status: DOWNLOAD_CONSOLE }))
    } else {
      let dataTicket = yield callExternalAction('consoleProxyTicket', Api.consoleProxyTicket,
        { type: 'INTRENAL_CONSOLE', payload: { vmId, consoleId } })
      let ticket = yield callExternalAction('consoleTicket', Api.consoleTicket,
        { type: 'INTRENAL_CONSOLE', payload: { vmId, consoleId } })
      yield put(setConsoleTickets({ vmId, proxyTicket: dataTicket.proxy_ticket.value, ticket: ticket.ticket }))
      yield put(setConsoleStatus({ vmId, status: INIT_CONSOLE }))
    }
    if (openInPage || isNoVNC) {
      yield put(push('/vm/' + vmId + '/console/' + consoleId))
    }
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
  console.log('downloadVmConsole() console options not yet present, trying to load from local storage')
  yield getConsoleOptions(getConsoleOptionsAction({ vmId }))
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
export function* getRDPVm (action) {
  const rdpBuilder = new RDPBuilder(action.payload)
  const data = rdpBuilder.buildRDP()
  fileDownload({ data, fileName: 'console.rdp', mimeType: 'application/rdp' })
}

// -----

/**
 * Check the sessions on a VM and if someone other then the given user has an open
 * console, flag the console as "in use" requiring manual confirmation to open the
 * console (which will disconnect the other user's existing session).
 */
export function* openConsoleModal (action) {
  let { modalId, vmId, usbAutoshare, usbFilter, userId, hasGuestAgent, consoleId, isNoVNC, openInPage } = action.payload
  yield put(setNewConsoleModal({ modalId, vmId, consoleId }))
  const sessionsInternal = yield fetchVmSessions({ vmId })
  const consoleUsers = sessionsInternal && sessionsInternal
    .filter(session => session.consoleUser)
    .map(session => session.user)
  yield put(setVmSessions({ vmId, sessions: sessionsInternal }))

  if (consoleUsers.length > 0 && consoleUsers.find(user => user.id === userId) === undefined) {
    yield put(setInUseConsoleModalState({ modalId }))
  } else {
    yield put(downloadConsole({
      modalId,
      vmId,
      usbAutoshare,
      usbFilter,
      hasGuestAgent,
      consoleId,
      isNoVNC,
      openInPage,
      skipSSO: doesVmSessionExistForUserId(sessionsInternal, userId),
    }))
  }
}

// ----- Console Options (per VM) held by `OptionsManager`
export function* getConsoleOptions (action) {
  const options = OptionsManager.loadConsoleOptions(action.payload)
  yield put(setConsoleOptions({ vmId: action.payload.vmId, options }))
  return options
}

export function* saveConsoleOptions (action) {
  OptionsManager.saveConsoleOptions(action.payload)
  yield getConsoleOptions(getConsoleOptionsAction({ vmId: action.payload.vmId }))
}
