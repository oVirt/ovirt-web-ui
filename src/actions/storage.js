import {
  GET_ISO_STORAGES,
  GET_ALL_FILES_FOR_ISO,
} from '../constants/index'

export function setStorages ({ storages }) {
  return {
    type: 'SET_STORAGES',
    payload: {
      storages,
    },
  }
}

export function setFiles ({ storageId, files }) {
  return {
    type: 'SET_FILES',
    payload: {
      storageId,
      files,
    },
  }
}

export function removeMissingStorages ({ storageIdsToPreserve }) {
  return {
    type: 'REMOVE_MISSING_STORAGES',
    payload: {
      storageIdsToPreserve,
    },
  }
}

export function getISOStorages () {
  return {
    type: GET_ISO_STORAGES,
    payload: {},
  }
}

export function getAllFilesForISO ({ storageId }) {
  return {
    type: GET_ALL_FILES_FOR_ISO,
    payload: {
      storageId,
    },
  }
}
