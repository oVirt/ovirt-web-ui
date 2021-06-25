import {
  ADD_NETWORKS_TO_VNIC_PROFILES,
  SET_VNIC_PROFILES,
} from '_/constants'

export function setVnicProfiles ({ vnicProfiles }) {
  return {
    type: SET_VNIC_PROFILES,
    payload: {
      vnicProfiles,
    },
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
