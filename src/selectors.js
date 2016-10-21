import { Exception } from './exceptions'

let Selectors = {}
Selectors = {
  init ({store}) { // TODO: avoid init method
    Selectors.store = store
  },
  // --- config --
  getLoginToken () {
    return getState().config.get('loginToken')
  },
  // --- icons --
  getAllIcons () {
    return getState().icons
  }
}

function getState () {
  if (!Selectors.store) {
    throw new Exception('Selectors uninitialized - missing store. Call the Selectors.init() method')
  }
  return Selectors.store.getState()
}

export default Selectors
