/*
 Local/Session Storage manipulation
 */

export function saveToLocalStorage (key, value) {
  window.localStorage.setItem(key, value)
}

export function loadFromLocalStorage (key) {
  return window.localStorage.getItem(key)
}

export function removeFromLocalStorage (key) {
  return window.localStorage.removeItem(key)
}

// --------------------
export function saveToSessionStorage (key, value) {
  window.sessionStorage.setItem(key, value)
}

export function loadFromSessionStorage (key) {
  return window.sessionStorage.getItem(key)
}
