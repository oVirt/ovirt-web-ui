import { saveToLocalStorage, loadFromLocalStorage } from './storage'

export default {
  loadConsoleOptions ({ vmId }) {
    const autoOpenVmId = loadFromLocalStorage('autoConnect')
    const options = {}
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
    saveToLocalStorage(`consoleOptions.${vmId}`, options)
  },

  loadAutoConnectOption () {
    return loadFromLocalStorage('autoConnect')
  },
}
