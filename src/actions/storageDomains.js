// @flow

import {
  ADD_STORAGE_DOMAINS,
  GET_ALL_STORAGE_DOMAINS,
  GET_ISO_STORAGE_DOMAINS,
  SET_STORAGE_DOMAIN_FILES,
  SET_STORAGE_DOMAINS,
} from 'app-constants'

export function getAllStorageDomains (): Object {
  return {
    type: GET_ALL_STORAGE_DOMAINS,
  }
}

export function getIsoStorageDomains (): Object {
  return {
    type: GET_ISO_STORAGE_DOMAINS,
  }
}

export function setStorageDomains (storageDomains: Array<Object>): Object {
  return {
    type: SET_STORAGE_DOMAINS,
    payload: { storageDomains },
  }
}

export function addStorageDomains (storageDomains: Array<Object>): Object {
  return {
    type: ADD_STORAGE_DOMAINS,
    payload: storageDomains,
  }
}

export function setStorageDomainsFiles (storageDomainId: string, files: Array<Object>): Object {
  return {
    type: SET_STORAGE_DOMAIN_FILES,
    payload: {
      storageDomainId,
      files,
    },
  }
}
