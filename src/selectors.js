import { Exception } from './exceptions'

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
  getOperatingSystemByName (name) {
    return getState().operatingSystems.toList().find(os =>
      os.get('name') === name)
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
  getUserId () {
    return getState().config.getIn(['user', 'id'])
  },
  getUserGroups () {
    return getState().config.get('userGroups')
  },
}

function getState () {
  if (!Selectors.store) {
    throw new Exception('Selectors uninitialized - missing store. Call the Selectors.init() method')
  }
  return Selectors.store.getState()
}

export default Selectors
