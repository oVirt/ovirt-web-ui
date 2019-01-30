import { Exception } from './exceptions'

import { filterOsByArchitecture } from '_/helpers'

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
    return filterOsByArchitecture(getState().operatingSystems, architecture)
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
  getCurrentFetchPage () {
    return getState().vms.get('page')
  },
  getUserId () {
    return getState().config.getIn(['user', 'id'])
  },
  getUserGroups () {
    return getState().config.get('userGroups')
  },
  getCurrentPage () {
    return getState().config.get('currentPage')
  },
  getVmIds () {
    return getState().vms.get('vms').reduce((vmIds, vm, vmId) => {
      vmIds.push(vmId)
      return vmIds
    }, [])
  },
  getPoolIds () {
    return getState().vms.get('pools').reduce((poolIds, pool, poolId) => {
      poolIds.push(poolId)
      return poolIds
    }, [])
  },
}

function getState () {
  if (!Selectors.store) {
    throw new Exception('Selectors uninitialized - missing store. Call the Selectors.init() method')
  }
  return Selectors.store.getState()
}

export default Selectors
