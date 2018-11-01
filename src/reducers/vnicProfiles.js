import { fromJS } from 'immutable'
import { actionReducer } from './utils'
import {
  ADD_NETWORKS_TO_VNIC_PROFILES,
  SET_VNIC_PROFILES,
} from 'app-constants'

const initialState = fromJS({})

const vnicProfiles = actionReducer(initialState, {
  [SET_VNIC_PROFILES] (state, { payload: { vnicProfiles } }) {
    const result = {}
    vnicProfiles.forEach(vnicProfile => {
      result[vnicProfile.id] = vnicProfile
    })
    return fromJS(result)
  },
  [ADD_NETWORKS_TO_VNIC_PROFILES] (state, { payload: { networks } }) {
    return state.map((vnicProfile) => {
      const index = networks.findIndex((network) => network.id === vnicProfile.getIn(['network', 'id']))
      if (index > -1) {
        return vnicProfile.set('network', fromJS(networks[index]))
      }
      return vnicProfile
    })
  },
})

export default vnicProfiles
