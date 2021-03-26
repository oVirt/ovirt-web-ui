// @flow

import $ from 'jquery'
import { DEFAULT_LOCALE } from '_/intl'
import { Exception } from '../exceptions'
import Selectors from '../selectors'

//
// SSO Token Checks
//
/**
 * Return the SSO token for the current user session
 */
function _getLoginToken (): string {
  return Selectors.getLoginToken()
}

/**
 * Throw an Exception if the current user session SSO token is missing or expired.
 */
function assertLogin ({ methodName }: { methodName: string }) {
  if (!_getLoginToken()) {
    throw new Exception(`OvirtApi in '${methodName}': missing login`)
  }
  if (Selectors.isTokenExpired()) {
    throw new Exception(`OvirtApi in '${methodName}': sso token is expired`)
  }
}

//
// HTTP Listener Handling
//
type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE'
type ListenerType = (requestId: Object, eventType: 'START' | 'STOP') => void

const listeners: Set<ListenerType> = new Set()

function addHttpListener (listener: ListenerType) {
  listeners.add(listener)
}

var currentLocale = DEFAULT_LOCALE
function updateLocale (locale: string) {
  currentLocale = locale
}

function notifyStart (method: MethodType, url: string): Object {
  const requestId = { method, url }
  listeners.forEach(listener => listener(requestId, 'START'))
  return requestId
}

function notifyStop (requestId: Object) {
  listeners.forEach(listener => listener(requestId, 'STOP'))
}

//
// HTTP Verbs
//
type GetRequestType = { url: string, custHeaders?: Object}
type InputRequestType = { url: string, input: string, contentType?: string }
type DeleteRequestType = { url: string, custHeaders?: Object }

let getCounter = 0
const logHeaders = (headers) => JSON.stringify({ ...headers, 'Authorization': '*****' })

function httpGet ({ url, custHeaders = {} }: GetRequestType): Promise<Object> {
  const myCounter = getCounter++
  const requestId = notifyStart('GET', url)
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${_getLoginToken()}`,
    'Accept-Language': currentLocale,
    'Filter': Selectors.getFilter(),
    ...custHeaders,
  }

  console.log(`http GET[${myCounter}] 🡒 url: "${url}", headers: ${logHeaders(headers)}`)
  return $.ajax(url, {
    type: 'GET',
    headers,
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      console.log(`http GET[${myCounter}] 🡐 data:`, data)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax GET failed: ${JSON.stringify(data)}`)
      notifyStop(requestId)
      return Promise.reject(data)
    })
}

function httpPost ({ url, input, contentType = 'application/json' }: InputRequestType): Promise<Object> {
  const requestId = notifyStart('POST', url)
  return $.ajax(url, {
    type: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${_getLoginToken()}`,
      'Accept-Language': currentLocale,
      'Filter': Selectors.getFilter(),
      'Content-Type': contentType,
    },
    data: input,
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax POST failed: ${JSON.stringify(data)}`)
      notifyStop(requestId)
      return Promise.reject(data)
    })
}

function httpPut ({ url, input, contentType = 'application/json' }: InputRequestType): Promise<Object> {
  const requestId = notifyStart('PUT', url)
  return $.ajax(url, {
    type: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${_getLoginToken()}`,
      'Accept-Language': currentLocale,
      'Filter': Selectors.getFilter(),
      'Content-Type': contentType,
    },
    data: input,
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax PUT failed: ${JSON.stringify(data)}`)
      notifyStop(requestId)
      return Promise.reject(data)
    })
}

function httpDelete ({ url, custHeaders = { 'Accept': 'application/json' } }: DeleteRequestType): Promise<Object> {
  const requestId = notifyStart('DELETE', url)
  return $.ajax(url, {
    type: 'DELETE',
    headers: {
      'Authorization': `Bearer ${_getLoginToken()}`,
      'Filter': Selectors.getFilter(),
      ...custHeaders,
    },
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax DELETE failed: ${JSON.stringify(data)}`)
      notifyStop(requestId)
      return Promise.reject(data)
    })
}

//
// Exports
//
export type {
  MethodType,
  ListenerType,
}
export {
  addHttpListener,
  updateLocale,
  assertLogin,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
}
