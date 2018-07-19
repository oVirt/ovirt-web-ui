import Immutable, { Map } from 'immutable'

import {
  FAILED_EXTERNAL_ACTION,
  LOGOUT,
  POOL_ACTION_IN_PROGRESS,
  REMOVE_MISSING_POOLS,
  REMOVE_MISSING_VMS,
  REMOVE_POOLS,
  REMOVE_VMS,
  SET_CHANGED,
  SET_CONSOLE_IN_USE,
  SET_PAGE,
  SET_VM_CDROM,
  SET_VM_CONSOLES,
  SET_VM_DISKS,
  SET_VM_NICS,
  SET_VM_SESSIONS,
  SET_VM_SNAPSHOTS,
  UPDATE_POOLS,
  UPDATE_VMPOOLS_COUNT,
  UPDATE_VMS,
  VM_ACTION_IN_PROGRESS,
} from '../constants'
import { logError } from '../helpers'
import { actionReducer, removeMissingItems } from './utils'

const initialState = Immutable.fromJS({
  vms: {},
  pools: {},

  page: 1,
  /**
   * true ~ we need to fetch further vms and pools
   * false ~ all visible entities already fetched
   */
  notAllPagesLoaded: true,
})

const EMPTY_MAP = Immutable.fromJS({})
const EMPTY_ARRAY = Immutable.fromJS([])

const vms = actionReducer(initialState, {
  [UPDATE_VMS] (state, { payload: { vms, copySubResources, page } }) {
    const updates = {}

    vms.forEach(vm => {
      if (!state.getIn(['vms', vm.id])) {
        state = state.set('notAllPagesLoaded', true)
      }
      updates[vm.id] = vm

      if (copySubResources) {
        updates[vm.id].cdrom = state.getIn(['vms', vm.id, 'cdrom'], Immutable.fromJS({ file: { id: '' } })).toJS()
        updates[vm.id].consoles = state.getIn(['vms', vm.id, 'consoles'], EMPTY_MAP).toJS()
        updates[vm.id].disks = state.getIn(['vms', vm.id, 'disks'], EMPTY_MAP).toJS()
        updates[vm.id].nics = state.getIn(['vms', vm.id, 'nics'], EMPTY_ARRAY).toJS()
        updates[vm.id].sessions = state.getIn(['vms', vm.id, 'sessions'], EMPTY_ARRAY).toJS()
        updates[vm.id].snapshots = state.getIn(['vms', vm.id, 'snapshots'], EMPTY_ARRAY).toJS()
        updates[vm.id].statistics = state.getIn(['vms', vm.id, 'statistics'], EMPTY_ARRAY).toJS()
      }
    })

    let st = state.mergeIn(['vms'], Immutable.fromJS(updates))
    if (page) {
      st = st.set('page', page)
    }
    return st
  },
  [REMOVE_VMS] (state, { payload: { vmIds } }) {
    const mutable = state.asMutable()
    vmIds.forEach(vmId => mutable.deleteIn([ 'vms', vmId ]))
    return mutable.asImmutable()
  },
  [REMOVE_MISSING_VMS] (state, { payload: { vmIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'vms', idsToPreserve: vmIdsToPreserve })
  },

  [SET_VM_DISKS] (state, { payload: { vmId, disks } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'disks'], Immutable.fromJS(disks)) // deep immutable
    } else { // fail, if VM not found
      logError(`vms.setVmDisks() reducer: vmId ${vmId} not found`)
    }
    return state
  },
  [SET_VM_CDROM] (state, { payload: { vmId, cdrom } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'cdrom'], Immutable.fromJS(cdrom)) // deep immutable
    } else { // fail, if VM not found
      logError(`vms.setVmCdrom() reducer: vmId ${vmId} not found`)
    }
    return state
  },
  [SET_VM_SNAPSHOTS] (state, { payload: { vmId, snapshots } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'snapshots'], Immutable.fromJS(snapshots)) // deep immutable
    }

    logError(`vms.setVmSnapshots() reducer: vmId ${vmId} not found`)
    return state
  },
  [SET_VM_NICS] (state, { payload: { vmId, nics } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'nics'], Immutable.fromJS(nics)) // deep immutable
    } else { // fail, if VM not found
      logError(`vms.setVmNics() reducer: vmId ${vmId} not found`)
    }
    return state
  },
  [SET_VM_CONSOLES] (state, { payload: { vmId, consoles } }) {
    return state.setIn(['vms', vmId, 'consoles'], Immutable.fromJS(consoles))
  },
  [SET_VM_SESSIONS] (state, { payload: { vmId, sessions } }) {
    let consoleInUse = false
    for (var i in sessions) {
      if (sessions[i].consoleUser) {
        consoleInUse = true
        break
      }
    }
    state = state.setIn(['vms', vmId, 'sessions'], Immutable.fromJS(sessions))
    return state.setIn(['vms', vmId, 'consoleInUse'], consoleInUse)
  },
  [SET_CONSOLE_IN_USE] (state, { payload: { vmId, consoleInUse } }) {
    return state.setIn(['vms', vmId, 'consoleInUse'], consoleInUse)
  },
  [VM_ACTION_IN_PROGRESS] (state, { payload: { vmId, name, started } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'actionInProgress', name], started)
    }
    return state
  },

  [UPDATE_POOLS] (state, { payload: { pools } }) {
    const updates = {}
    pools.forEach(pool => {
      if (!state.getIn(['pools', pool.id])) {
        state = state.set('notAllPagesLoaded', true)
      }
      updates[pool.id] = pool
    })
    const imUpdates = Immutable.fromJS(updates)

    return state.mergeIn(['pools'], imUpdates)
  },
  [REMOVE_POOLS] (state, { payload: { poolIds } }) {
    const mutable = state.asMutable()
    poolIds.forEach(poolId => mutable.deleteIn([ 'pools', poolId ]))
    return mutable.asImmutable()
  },
  [REMOVE_MISSING_POOLS] (state, { payload: { poolIdsToPreserve } }) {
    const newPools = poolIdsToPreserve
      .reduce((pools, poolId) => {
        const pool = state.getIn(['pools', poolId])
        if (pool) {
          pools.set(poolId, pool)
        }
        return pools
      }, Map().asMutable())
      .asImmutable()
    return state.set('pools', newPools)
  },

  [POOL_ACTION_IN_PROGRESS] (state, { payload: { poolId, name, started } }) {
    return state.setIn(['pools', poolId, 'vm', 'actionInProgress', name], started)
  },

  [UPDATE_VMPOOLS_COUNT] (state) {
    state.get('pools').toList().map(pool => {
      state = state.setIn(['pools', pool.get('id'), 'vmsCount'], 0)
    })

    state.get('vms').toList().map(vm => {
      // Check if vm is in actual pool and its down, checking for down vms is for not count that vms in admin mode
      if (vm.getIn(['pool', 'id']) && vm.get('status') !== 'down') {
        state = state.updateIn(['pools', vm.getIn(['pool', 'id']), 'vmsCount'], count => count + 1)
      }
    })
    return state
  },

  [FAILED_EXTERNAL_ACTION] (state, { payload }) { // see the userMessages() reducer
    /* Example:
     payload = {
     "message": "[Cannot run VM. There is no host that satisfies current scheduling constraints.<snip>]",
     "type": 409,
     "action": {"type": "START_VM", "payload": {"vmId": "083bd87a-bdd6-47ee-b997-2c9eb381cf79"}}
     }
     */
    if (payload.message && payload.action && payload.action.payload) {
      if (payload.action.payload.vmId) {
        const vmId = payload.action.payload.vmId
        if (state.getIn(['vms', vmId])) {
          return state.setIn(['vms', vmId, 'lastMessage'], payload.shortMessage ? payload.shortMessage : payload.message)
        } else { // fail, if VM not found
          logError('API reports an error associated to nonexistent VM. error=', payload, 'vmId=', vmId)
        }
      }
    }
    return state
  },

  [SET_PAGE] (state, { payload: { page } }) {
    return state.set('page', page)
  },
  [SET_CHANGED] (state, { payload: { value } }) {
    return state.set('notAllPagesLoaded', value)
  },
  [LOGOUT] (state) { // see the config() reducer
    return state.set('vms', EMPTY_MAP)
  },
})

export default vms
export {
  initialState,
}
