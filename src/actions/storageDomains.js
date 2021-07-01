// @flow

import {
  SET_STORAGE_DOMAIN_FILES,
  SET_STORAGE_DOMAINS,
} from '_/constants'

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
