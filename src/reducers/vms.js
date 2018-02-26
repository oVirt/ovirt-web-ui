import Immutable, { Map } from 'immutable'
import { logError } from '../helpers'
import { actionReducer, removeMissingItems } from './utils'

const initialState = Immutable.fromJS({
  vms: {},
  pools: {},
  loadInProgress: true,
  page: 1,
  /**
   * true ~ we need to fetch further vms and pools
   * false ~ all visible entities already fetched
   */
  notAllPagesLoaded: true,
})

const vms = actionReducer(initialState, {
  UPDATE_VMS (state, { payload: { vms, copySubResources, page } }) {
    const emptyMap = Map()
    const updates = {}
    vms.forEach(vm => {
      if (!state.getIn(['vms', vm.id])) {
        state = state.set('notAllPagesLoaded', true)
      }
      updates[vm.id] = vm

      if (copySubResources) {
        updates[vm.id].disks = state.getIn(['vms', vm.id, 'disks'], emptyMap).toJS()
        updates[vm.id].consoles = state.getIn(['vms', vm.id, 'consoles'], emptyMap).toJS()
        updates[vm.id].cdrom = state.getIn(['vms', vm.id, 'cdrom'], Immutable.fromJS({ file: { id: '' } })).toJS()
        updates[vm.id].nics = state.getIn(['vms', vm.id, 'nics'], Immutable.fromJS([])).toJS()
      }
    })
    const imUpdates = Immutable.fromJS(updates)
    let st = state.mergeIn(['vms'], imUpdates)
    if (page) {
      st = st.set('page', page)
    }
    return st
  },
  REMOVE_VMS (state, { payload: { vmIds } }) {
    const mutable = state.asMutable()
    vmIds.forEach(vmId => mutable.deleteIn([ 'vms', vmId ]))
    return mutable.asImmutable()
  },
  REMOVE_MISSING_VMS (state, { payload: { vmIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'vms', idsToPreserve: vmIdsToPreserve })
  },
  SET_VM_DISKS (state, { payload: { vmId, disks } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'disks'], Immutable.fromJS(disks)) // deep immutable
    } else { // fail, if VM not found
      logError(`vms.setVmDisks() reducer: vmId ${vmId} not found`)
    }
    return state
  },
  SET_VM_CDROM (state, { payload: { vmId, cdrom } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'cdrom'], Immutable.fromJS(cdrom)) // deep immutable
    } else { // fail, if VM not found
      logError(`vms.setVmCdrom() reducer: vmId ${vmId} not found`)
    }
    return state
  },
  SET_VM_NICS (state, { payload: { vmId, nics } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'nics'], Immutable.fromJS(nics)) // deep immutable
    } else { // fail, if VM not found
      logError(`vms.setVmNics() reducer: vmId ${vmId} not found`)
    }
    return state
  },
  VM_ACTION_IN_PROGRESS (state, { payload: { vmId, name, started } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'actionInProgress', name], started)
    }
    return state
  },
  POOL_ACTION_IN_PROGRESS (state, { payload: { poolId, name, started } }) {
    return state.setIn(['pools', poolId, 'vm', 'actionInProgress', name], started)
  },
  SET_VM_CONSOLES (state, { payload: { vmId, consoles } }) {
    return state.setIn(['vms', vmId, 'consoles'], Immutable.fromJS(consoles))
  },
  SET_VM_SESSIONS (state, { payload: { vmId, sessions } }) {
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
  UPDATE_POOLS (state, { payload: { pools } }) {
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
  REMOVE_POOLS (state, { payload: { poolIds } }) {
    const mutable = state.asMutable()
    poolIds.forEach(poolId => mutable.deleteIn([ 'pools', poolId ]))
    return mutable.asImmutable()
  },
  REMOVE_MISSING_POOLS (state, { payload: { poolIdsToPreserve } }) {
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
  UPDATE_VMPOOLS_COUNT (state) {
    state.get('pools').toList().map(pool => {
      state = state.setIn(['pools', pool.id, 'vmsCount'], 0)
    })

    state.get('vms').toList().map(vm => {
      // Check if vm is in actual pool and its down, checking for down vms is for not count that vms in admin mode
      if (vm.getIn(['pool', 'id']) && vm.get('status') !== 'down') {
        state = state.updateIn(['pools', vm.getIn(['pool', 'id']), 'vmsCount'], count => count + 1)
      }
    })
    return state
  },
  LOGOUT (state) { // see the config() reducer
    return state.set('vms', Immutable.fromJS({}))
  },
  SET_LOAD_IN_PROGRESS (state, { payload: { value } }) {
    return state.set('loadInProgress', value)
  },
  SET_PAGE (state, { payload: { page } }) {
    return state.set('page', page)
  },
  FAILED_EXTERNAL_ACTION (state, { payload }) { // see the userMessages() reducer
    /* Example:
     payload = {
     "message": "[Cannot run VM. There is no host that satisfies current scheduling constraints. See below for details:, The host vdsm did not satisfy internal filter CPU because it does not have enough cores to run the VM.]",
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
  SET_CHANGED (state, { payload: { value } }) {
    return state.set('notAllPagesLoaded', value)
  },
})

export default vms
