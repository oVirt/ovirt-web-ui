// @flow

import {
  GET_ALL_STORAGE_DOMAINS,
  SET_STORAGE_DOMAINS,
} from '../constants'

export function getAllStorageDomains (): Object {
  return {
    type: GET_ALL_STORAGE_DOMAINS,
  }
}

export function setStorageDomains (storageDomains: Array<Object>): Object {
  return {
    type: SET_STORAGE_DOMAINS,
    payload: { storageDomains },
  }
}
