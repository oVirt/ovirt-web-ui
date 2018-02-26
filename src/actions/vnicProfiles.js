import {
  GET_ALL_VNIC_PROFILES,
} from '../constants/index'

export function removeMissingVnicProfiles ({ vnicProfileIdsToPreserve }) {
  return {
    type: 'REMOVE_MISSING_VNIC_PROFILES',
    payload: {
      vnicProfileIdsToPreserve,
    },
  }
}

export function addVnicProfiles ({ vnicProfiles }) {
  return {
    type: 'ADD_VNIC_PROFILES',
    payload: {
      vnicProfiles,
    },
  }
}

export function getAllVnicProfiles () {
  return {
    type: GET_ALL_VNIC_PROFILES,
    payload: {},
  }
}
