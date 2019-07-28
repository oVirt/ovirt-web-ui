// @flow

import {
  GET_ALL_STORAGE_DOMAINS,
  GET_ISO_FILES,
  SET_STORAGE_DOMAIN_FILES,
  SET_STORAGE_DOMAINS,
} from '_/constants'

export function getAllStorageDomains (): Object {
  return { type: GET_ALL_STORAGE_DOMAINS }
}

export function getIsoFiles (): Object {
  return { type: GET_ISO_FILES }
}

export function setStorageDomains (storageDomains: Array<Object>): Object {
  return {
    type: SET_STORAGE_DOMAINS,
    payload: { storageDomains },
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
