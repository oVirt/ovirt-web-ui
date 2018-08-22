// @flow

import $ from 'jquery'
import AppConfiguration from '../config'
import { Exception } from '../exceptions'
import logger from '../logger'
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

function httpGet ({ url, custHeaders = {} }: GetRequestType): Promise<Object> {
  logger.log(`_httpGet start: url="${url}"`)
  const requestId = notifyStart('GET', url)
  const headers = Object.assign({
    'Authorization': `Bearer ${_getLoginToken()}`,
    'Accept-Language': AppConfiguration.queryParams.locale, // can be: undefined, empty or string
    'Filter': Selectors.getFilter(),
    'Accept': 'application/json',
  }, custHeaders)
  logger.log(`_httpGet: url="${url}", headers="${JSON.stringify(headers)}"`)

  return $.ajax(url, {
    type: 'GET',
    headers,
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      logger.log(`Ajax failed: ${JSON.stringify(data)}`)
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
      'Content-Type': contentType,
      'Authorization': `Bearer ${_getLoginToken()}`,
      'Accept-Language': AppConfiguration.queryParams.locale,
      'Filter': Selectors.getFilter(),
    },
    data: input,
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      logger.log(`Ajax failed: ${JSON.stringify(data)}`)
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
      'Content-Type': contentType,
      'Authorization': `Bearer ${_getLoginToken()}`,
      'Accept-Language': AppConfiguration.queryParams.locale,
      'Filter': Selectors.getFilter(),
    },
    data: input,
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      logger.log(`Ajax failed: ${JSON.stringify(data)}`)
      notifyStop(requestId)
      return Promise.reject(data)
    })
}

function httpDelete ({ url, custHeaders = { 'Accept': 'application/json' } }: DeleteRequestType): Promise<Object> {
  const headers = Object.assign({
    'Authorization': `Bearer ${_getLoginToken()}`,
    'Filter': Selectors.getFilter(),
  }, custHeaders)
  const requestId = notifyStart('DELETE', url)
  logger.log(`_httpDelete: url="${url}", headers="${JSON.stringify(headers)}"`)

  return $.ajax(url, {
    type: 'DELETE',
    headers,
  })
    .then((data: Object): Object => {
      notifyStop(requestId)
      return data
    })
    .catch((data: Object): Promise<Object> => {
      logger.log(`Ajax failed: ${JSON.stringify(data)}`)
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
  assertLogin,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
}
