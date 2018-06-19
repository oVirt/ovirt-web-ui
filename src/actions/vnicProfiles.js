import {
  ADD_NETWORKS_TO_VNIC_PROFILES,
  SET_VNIC_PROFILES,
  GET_ALL_VNIC_PROFILES,
} from '../constants'

export function setVnicProfiles ({ vnicProfiles }) {
  return {
    type: SET_VNIC_PROFILES,
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

export function addNetworksToVnicProfiles ({ networks }) {
  return {
    type: ADD_NETWORKS_TO_VNIC_PROFILES,
    payload: {
      networks,
    },
  }
}
