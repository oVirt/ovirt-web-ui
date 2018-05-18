import { Exception } from './exceptions'

const PPC_64 = 'ppc64'
const S390X = 's390x'

let Selectors = {}
Selectors = {
  init ({ store }) {
    Selectors.store = store
  },
  // --- config --
  getLoginToken () {
    return getState().config.get('loginToken')
  },
  isTokenExpired () {
    return getState().config.get('isTokenExpired')
  },
  getOvirtVersion () {
    return getState().config.get('oVirtApiVersion')
  },
  isSchedulerEnabled () {
    return getState().config.get('schedulerEnabled')
  },
  // --- icons --
  getAllIcons () {
    return getState().icons
  },
  // --- vms --
  getVmDisks ({ vmId }) {
    return getState().vms.getIn(['vms', vmId, 'disks'])
  },
  getOperatingSystemByName (name) {
    return getState().operatingSystems.toList().find(os =>
      os.get('name') === name)
  },
  getOperatingSystemsByArchitecture (architecture) {
    return getState().operatingSystems.filter(os => {
      const osName = os.get('name')
      if (architecture === PPC_64 || architecture === S390X) {
        return osName.includes(architecture)
      } else {
        // default to x64_86 for others (x64_86, undefined - all architectures)
        return !osName.includes(PPC_64) && !osName.includes(S390X)
      }
    })
  },
  getClusterById (clusterId) {
    return getState().clusters.get(clusterId)
  },
  getTemplateById (templateId) {
    return getState().templates.get(templateId)
  },
  getFilter () {
    return getState().config.get('filter')
  },
  isFilterChecked () { // Has initialization passed?
    return getState().config.get('isFilterChecked')
  },
  getConsoleOptions ({ vmId }) {
    return getState().options.getIn(['options', 'consoleOptions', vmId])
  },
  getCurrentPage () {
    return getState().vms.get('page')
  },
}

function getState () {
  if (!Selectors.store) {
    throw new Exception('Selectors uninitialized - missing store. Call the Selectors.init() method')
  }
  return Selectors.store.getState()
}

export default Selectors
