// @flow

import $ from 'jquery'
import { DEFAULT_LOCALE } from '_/intl'
import uniqueId from 'lodash/uniqueId'
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
type RequestTrackerType = {
  method: MethodType,
  url: string,
  uid: string
}
type ListenerType = (requestTracker: RequestTrackerType, eventType: 'START' | 'STOP') => void

const listeners: Set<ListenerType> = new Set()

function addHttpListener (listener: ListenerType) {
  listeners.add(listener)
}

let currentLocale = DEFAULT_LOCALE
function updateLocale (locale: string) {
  currentLocale = locale
}

function notifyStart (method: MethodType, url: string): RequestTrackerType {
  const requestTracker = { method, url, uid: uniqueId('t_') }
  listeners.forEach(listener => listener(requestTracker, 'START'))
  return requestTracker
}

function notifyStop (requestTracker: RequestTrackerType) {
  listeners.forEach(listener => listener(requestTracker, 'STOP'))
}

//
// HTTP Verbs
//
type GetRequestType = { url: string, custHeaders?: Object}
type InputRequestType = { url: string, input: string, contentType?: string }
type DeleteRequestType = { url: string, custHeaders?: Object }

const logHeaders = (headers) => JSON.stringify({ ...headers, Authorization: '*****' })

function httpGet ({ url, custHeaders = {} }: GetRequestType): Promise<Object> {
  const requestTracker = notifyStart('GET', url)
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${_getLoginToken()}`,
    'Accept-Language': currentLocale,
    Filter: Selectors.getFilter(),
    ...custHeaders,
  }

  console.log(`http GET[${requestTracker.uid}] 🡒 url: "${url}", headers: ${logHeaders(headers)}`)
  return $.ajax(url, {
    type: 'GET',
    headers,
  })
    .then((data: Object): Object => {
      notifyStop(requestTracker)
      console.log(`http GET[${requestTracker.uid}] 🡐 data:`, data)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax GET failed: ${JSON.stringify(data)}`)
      notifyStop(requestTracker)
      return Promise.reject(data)
    })
}

function httpPost ({ url, input, contentType = 'application/json' }: InputRequestType): Promise<Object> {
  const requestTracker = notifyStart('POST', url)
  return $.ajax(url, {
    type: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${_getLoginToken()}`,
      'Accept-Language': currentLocale,
      Filter: Selectors.getFilter(),
      'Content-Type': contentType,
    },
    data: input,
  })
    .then((data: Object): Object => {
      notifyStop(requestTracker)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax POST failed: ${JSON.stringify(data)}`)
      notifyStop(requestTracker)
      return Promise.reject(data)
    })
}

function httpPut ({ url, input, contentType = 'application/json' }: InputRequestType): Promise<Object> {
  const requestTracker = notifyStart('PUT', url)
  return $.ajax(url, {
    type: 'PUT',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${_getLoginToken()}`,
      'Accept-Language': currentLocale,
      Filter: Selectors.getFilter(),
      'Content-Type': contentType,
    },
    data: input,
  })
    .then((data: Object): Object => {
      notifyStop(requestTracker)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax PUT failed: ${JSON.stringify(data)}`)
      notifyStop(requestTracker)
      return Promise.reject(data)
    })
}

function httpDelete ({ url, custHeaders = { Accept: 'application/json' } }: DeleteRequestType): Promise<Object> {
  const requestTracker = notifyStart('DELETE', url)
  return $.ajax(url, {
    type: 'DELETE',
    headers: {
      Authorization: `Bearer ${_getLoginToken()}`,
      Filter: Selectors.getFilter(),
      ...custHeaders,
    },
  })
    .then((data: Object): Object => {
      notifyStop(requestTracker)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      console.log(`Ajax DELETE failed: ${JSON.stringify(data)}`)
      notifyStop(requestTracker)
      return Promise.reject(data)
    })
}

//
// Exports
//
export type {
  MethodType,
  RequestTrackerType,
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
