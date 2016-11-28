import { logDebug } from 'ovirt-ui-components'

/*
Local/Session Storage manipulation
 */
export function saveToSessionStorage (key, value) {
  window.sessionStorage.setItem(key, value)
}

export function loadFromSessionStorage (key) {
  return window.sessionStorage.getItem(key)
}

export function clearFromSessionStorage (key) {
  window.sessionStorage.removeItem(key)
}

export function saveToLocalStorage (key, value) {
  window.localStorage.setItem(key, value)
}

export function loadFromLocalStorage (key) {
  return window.localStorage.getItem(key)
}

// --------------------------------------------------
/*
export function persistTokenToSessionStorage ({ token, username }) {
  saveToSessionStorage('TOKEN', token)
  saveToSessionStorage('USERNAME', username)
}

export function clearTokenFromSessionStorage () {
  clearFromSessionStorage('TOKEN')
  clearFromSessionStorage('USERNAME')
}

export function loadTokenFromSessionStorage () {
  return {
    token: loadFromSessionStorage('TOKEN'),
    username: loadFromSessionStorage('USERNAME'),
  }
}
*/
export function clearStateInLocalStorage () {
  saveToLocalStorage('icons', undefined)
}

export function persistStateToLocalStorage ({ icons }) {
  logDebug(`persistStateToLocalStorage() called`)
  saveToLocalStorage('icons', JSON.stringify(icons))
}

export function loadStateFromLocalStorage () {
  logDebug(`loadStateFromLocalStorage() called`)
  return {
    icons: JSON.parse(loadFromLocalStorage('icons')),
  }
}
