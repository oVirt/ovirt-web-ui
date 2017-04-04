import { Exception } from './exceptions'

let Selectors = {}
Selectors = {
  init ({ store }) { // TODO: avoid init method
    Selectors.store = store
  },
  // --- config --
  getLoginToken () {
    return getState().config.get('loginToken')
  },
  // --- icons --
  getAllIcons () {
    return getState().icons
  },
  // --- vms --
  getVmDisks ({ vmId }) {
    return getState().vms.getIn(['vms', vmId, 'disks'])
  },
  getFirstCluster () {
    return getState().clusters.get('clusters').toList().first()
  },
  getClusterById (id) {
    return getState().clusters.get('clusters').get(id)
  },
  getClusterByName (name) {
    return getState().clusters.get('clusters').toList().find(cluster =>
      cluster.get('name') === name)
  },
  getTemplateById (id) {
    return getState().templates.get('templates').get(id)
  },
  getTemplateByName (name) {
    return getState().templates.get('templates').toList().find(template =>
      template.get('name') === name)
  },
  getOperatingSystemByName (name) {
    return getState().operatingSystems.get('operatingSystems').toList().find(os =>
      os.get('name') === name)
  },
}

function getState () {
  if (!Selectors.store) {
    throw new Exception('Selectors uninitialized - missing store. Call the Selectors.init() method')
  }
  return Selectors.store.getState()
}

export default Selectors
