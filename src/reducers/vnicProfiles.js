import { fromJS } from 'immutable'
import { actionReducer } from './utils'
import { SET_VNIC_PROFILES, ADD_NETWORKS_TO_VNIC_PROFILES } from '../constants'

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
    state.map((vnicProfile) => {
      const ind = networks.findIndex((network) => network.id === vnicProfile.getIn(['network', 'id']))
      if (ind > -1) {
        vnicProfile.set('network', fromJS(networks[ind]))
      }
    })
  },
})

export default vnicProfiles
