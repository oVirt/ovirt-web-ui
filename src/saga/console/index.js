import { put } from 'redux-saga/effects'

import Api from 'ovirtapi'
import Selectors from '../../selectors'
import OptionsManager from '../../optionsManager'
import logger from '../../logger'
import { fileDownload } from 'app-helpers'
import {
  downloadConsole,
  getConsoleOptions as getConsoleOptionsAction,
  setConsoleInUse,
  setConsoleOptions,
  setVmConsoles,
  vmActionInProgress,
  setConsoleIsValid,
} from 'app-actions'

import { callExternalAction } from '../utils'
import { fetchVmSessions } from '../../sagas'

import { adjustVVFile } from './vvFileUtils'
import RDPBuilder from './rdpBuilder'

// ----- Connection files
/**
 * Push a virt-viewer connection file (__console.vv__) to connect a user to a VM's console
 */
export function* downloadVmConsole (action) {
  let { vmId, consoleId, usbFilter } = action.payload

  let isSpice = false

  if (!consoleId) {
    yield put(vmActionInProgress({ vmId, name: 'getConsole', started: true }))
    const consolesInternal = yield fetchConsoleVmMeta({ vmId })
    yield put(setVmConsoles({ vmId, consoles: consolesInternal }))
    yield put(vmActionInProgress({ vmId, name: 'getConsole', started: false }))

    // TODO: choose user default over just "SPICE"
    if (consolesInternal && consolesInternal.length > 0) {
      let console = consolesInternal.find(c => c.protocol === 'spice') || consolesInternal[0]
      consoleId = console.id
      if (console.protocol === 'spice') {
        isSpice = true
      }
    }
  }

  if (consoleId) {
    let data = yield callExternalAction('console', Api.console, { type: 'INTERNAL_CONSOLE', payload: { vmId, consoleId } })

    if (data.error === undefined) {
      let options = Selectors.getConsoleOptions({ vmId })
      if (!options) {
        logger.log('downloadVmConsole() console options not yet present, trying to load from local storage')
        options = yield getConsoleOptions(getConsoleOptionsAction({ vmId }))
      }

      data = adjustVVFile({ data, options, usbFilter, isSpice })
      fileDownload({ data, fileName: `console.vv`, mimeType: 'application/x-virt-viewer' })
    }
  }
  yield put(setConsoleInUse({ vmId, consoleInUse: null }))
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

export function* fetchConsoleVmMeta ({ vmId }) {
  const consoles = yield callExternalAction('consoles', Api.consoles, { type: 'INTERNAL_CONSOLES', payload: { vmId } })

  if (consoles && consoles['graphics_console']) { // && consoles['graphics_console'].length > 0) {
    return Api.consolesToInternal({ consoles })
  }
  return []
}

/**
 * Check the consoleUser sessions on a VM and
 */
export function* getConsoleInUse (action) {
  let { vmId, usbFilter, userId } = action.payload
  yield put(setConsoleIsValid({ vmId, isValid: false }))

  const sessionsInternal = yield fetchVmSessions({ vmId })
  logger.log(`vmId: ${vmId}, sessions: ${JSON.stringify(sessionsInternal)}`)

  if (sessionsInternal && sessionsInternal.find((x) => x.consoleUser && (!userId || x.user.id === userId)) !== undefined) {
    yield put(setConsoleInUse({ vmId, consoleInUse: true }))
  } else {
    yield put(setConsoleInUse({ vmId, consoleInUse: false }))
    yield put(downloadConsole({ vmId, usbFilter }))
    yield put(setConsoleInUse({ vmId, consoleInUse: null }))
  }
  yield put(setConsoleIsValid({ vmId, isValid: true }))
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
