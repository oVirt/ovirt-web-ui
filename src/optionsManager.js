import { saveToLocalStorage, loadFromLocalStorage, removeFromLocalStorage } from './storage'
import { logDebug } from './helpers'

export default {
  loadConsoleOptions ({ vmId }) {
    const autoOpenVmId = loadFromLocalStorage('autoConnect')

    const optionsJson = loadFromLocalStorage(`consoleOptions.${vmId}`)
    let options
    try {
      options = (optionsJson && JSON.parse(optionsJson)) || {}
    } catch (e) {
      logDebug('Unable to parse consoleOptions from local storrage: ', optionsJson)
      options = {}
    }

    if (vmId === autoOpenVmId) {
      options.autoConnect = true
    }
    return options
  },

  saveConsoleOptions ({ vmId, options }) {
    if (options.autoConnect) {
      saveToLocalStorage('autoConnect', vmId)
    } else {
      const autoVmId = loadFromLocalStorage('autoConnect')
      if (autoVmId === vmId) {
        saveToLocalStorage('autoConnect', '')
      }
    }
    options.autoConnect = undefined

    saveToLocalStorage(`consoleOptions.${vmId}`, JSON.stringify(options))
  },

  clearAutoConnect () {
    let vmId = loadFromLocalStorage('autoConnect')
    if (vmId) {
      saveToLocalStorage('autoConnect', '')
      removeFromLocalStorage(`consoleOptions.${vmId}`)
    }
  },

  loadAutoConnectOption () {
    return loadFromLocalStorage('autoConnect')
  },
}
