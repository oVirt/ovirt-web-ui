import { fromJS } from 'immutable'

import { SET_HOSTS } from 'app-constants'
import { actionReducer } from './utils'
import { arrayToMap } from 'helpers'

const initialState = fromJS({})

const hosts = actionReducer(initialState, {
  [SET_HOSTS] (state, { payload: hosts }) {
    return fromJS(arrayToMap(hosts, host => host.id))
  },
})

export default hosts
