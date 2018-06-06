import { fromJS } from 'immutable'

import { SET_HOSTS } from '../constants'
import { actionReducer } from './utils'
import { arrayToMap } from '../helpers'

const initialState = fromJS({})

const hosts = actionReducer(initialState, {
  [SET_HOSTS] (state, { payload: hosts }) {
    return arrayToMap(hosts, host => host.id)
  },
})

export default hosts
