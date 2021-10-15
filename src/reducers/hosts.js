// @flow

import produce from 'immer'
import { SET_HOSTS } from '_/constants'
import { arrayToMap } from '_/helpers'
import { actionReducer } from './utils'

type HostsStateType = {
  [hostId: string]: Object
}

const initialState: HostsStateType = {}

const hosts = actionReducer(initialState, {
  [SET_HOSTS]: produce((draft: HostsStateType, { payload: hosts }: { payload: { hosts: Array<Object> }}) => {
    return arrayToMap(hosts, host => host.id)
  }),
})

export default hosts
