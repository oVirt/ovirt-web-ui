import Api from '../ovirtapi'
import Selectors from '../selectors'
import OptionsManager from '../optionsManager'
import RDPBuilder from './rdp-builder'

import {
  logDebug,
  fileDownload,
} from '../helpers'

import { callExternalAction } from './utils'

import {
  put,
} from 'redux-saga/effects'

import {
  vmActionInProgress,
  setVmConsoles,
  setConsoleOptions,
  getConsoleOptions as getConsoleOptionsAction,
} from '../actions'

function adjustVVFile ({ data, options, usbFilter, isSpice }) {
  // to simplify other flow, let's handle both 'options' from redux (immutableJs) or plain JS object from getConsoleOptions()
  // logDebug('adjustVVFile data before: ', data)
  logDebug('adjustVVFile options: ', options)

  if (options && (options.get && options.get('fullscreen') || options.fullscreen)) {
    data = data.replace(/^fullscreen=0/mg, 'fullscreen=1')
  }

  const pattern = /^secure-attention=.*$/mg
  let text = 'secure-attention=ctrl+alt+del'
  if (options && (options.get && options.get('ctrlAltDelToEnd') || options.ctrlAltDelToEnd)) {
    text = 'secure-attention=ctrl+alt+end'
  }
  if (data.match(pattern)) {
    logDebug('secure-attention found, replacing by ', text)
    data = data.replace(pattern, text)
  } else {
    logDebug('secure-attention was not found, inserting ', text)
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\n${text}`) // ending \n is already there
  }
  if (usbFilter) {
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\nusb-filter=${usbFilter}`)
  }
  if (options && isSpice) {
    const smartcardEnabled = options.get ? options.get('smartcardEnabled') : options.smartcardEnabled
    data = data.replace(/^enable-smartcard=[01]$/mg, `enable-smartcard=${smartcardEnabled ? 1 : 0}`)
  }
  logDebug('adjustVVFile data after adjustment: ', data)
  return data
}

export function * downloadVmConsole (action) {
  let { vmId, consoleId, usbFilter } = action.payload

  let isSpice = false

  if (!consoleId) {
    yield put(vmActionInProgress({ vmId, name: 'getConsole', started: true }))
    const consolesInternal = yield fetchConsoleVmMeta({ vmId }) // refresh metadata
    yield put(setVmConsoles({ vmId, consoles: consolesInternal }))
    yield put(vmActionInProgress({ vmId, name: 'getConsole', started: false }))

    // TODO: choose user default over just 'SPICE'
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
        logDebug('downloadVmConsole() console options not yet present, trying to load from local storage')
        options = yield getConsoleOptions(getConsoleOptionsAction({ vmId }))
      }

      data = adjustVVFile({ data, options, usbFilter, isSpice })
      fileDownload({ data, fileName: 'console.vv', mimeType: 'application/x-virt-viewer' })
    }
  }
}

export function * getConsoleOptions (action) {
  const options = OptionsManager.loadConsoleOptions(action.payload)
  yield put(setConsoleOptions({ vmId: action.payload.vmId, options }))
  return options
}

export function * saveConsoleOptions (action) {
  OptionsManager.saveConsoleOptions(action.payload)
  yield getConsoleOptions(getConsoleOptionsAction({ vmId: action.payload.vmId }))
}

export function * getRDPVm (action) {
  const rdpBuilder = new RDPBuilder(action.payload)
  const data = rdpBuilder.buildRDP()
  fileDownload({ data, fileName: 'console.rdp', mimeType: 'application/rdp' })
}

export function * fetchConsoleVmMeta ({ vmId }) {
  const consoles = yield callExternalAction('consoles', Api.consoles, { type: 'INTERNAL_CONSOLES', payload: { vmId } })

  if (consoles && consoles['graphics_console']) { // && consoles['graphics_console'].length > 0) {
    return Api.consolesToInternal({ consoles })
  }
  return []
}
