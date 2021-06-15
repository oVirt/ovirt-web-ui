import Immutable, { Map } from 'immutable'

import {
  FAILED_EXTERNAL_ACTION,
  LOGOUT,
  POOL_ACTION_IN_PROGRESS,
  REMOVE_MISSING_POOLS,
  REMOVE_MISSING_VMS,
  REMOVE_POOLS,
  REMOVE_VMS,
  SET_FILTERS,
  SET_VM_SORT,
  SET_VM_ACTION_RESULT,
  SET_VM_DISKS,
  SET_VM_NICS,
  SET_VM_SESSIONS,
  SET_VM_SNAPSHOTS,
  UPDATE_PAGING_DATA,
  UPDATE_POOLS,
  UPDATE_VM_SNAPSHOT,
  UPDATE_VMPOOLS_COUNT,
  UPDATE_VM_DISK,
  UPDATE_VMS,
  VM_ACTION_IN_PROGRESS,
} from '_/constants'
import { actionReducer, removeMissingItems } from './utils'
import { SortFields } from '_/utils'

const initialState = Immutable.fromJS({
  vms: {},
  pools: {},
  filters: {},
  sort: { ...SortFields.NAME, isAsc: true },

  missedVms: Immutable.Set(),

  vmsPage: 0,
  vmsExpectMorePages: true,

  poolsPage: 0,
  poolsExpectMorePages: true,

  correlationResult: {},
})

const vms = actionReducer(initialState, {

  // vms come in as Internal transformed JS objects that will be pushed to ImmutableJS
  //     objects after an optional merge with existing vm data
  [UPDATE_VMS] (state, { payload: { vms, copySubResources } }) {
    const updates = {}

    vms.forEach(vm => {
      const existingVm = state.hasIn(['vms', vm.id]) ? state.getIn(['vms', vm.id]).toJS() : false

      updates[vm.id] = vm
      updates[vm.id].actionResults = (existingVm && existingVm.actionResults) || {}

      // Copy across the VM_FETCH_ADDITIONAL_DEEP values from the existingVm
      if (existingVm && copySubResources) {
        // Only copy consoles if the VM does not already have any
        updates[vm.id].consoles = vm.consoles.length === 0 ? existingVm.consoles || [] : vm.consoles

        updates[vm.id].cdrom = existingVm.cdrom || { file: { id: '' } }
        updates[vm.id].disks = existingVm.disks || []
        updates[vm.id].nics = existingVm.nics || []
        updates[vm.id].sessions = existingVm.sessions || []
        updates[vm.id].snapshots = existingVm.snapshots || []
        updates[vm.id].statistics = existingVm.statistics || []

        updates[vm.id].permissions = existingVm.permissions || []
        updates[vm.id].userPermits = existingVm.userPermits || []
        updates[vm.id].canUserChangeCd = !!existingVm.canUserChangeCd
        updates[vm.id].canUserEditVm = !!existingVm.canUserEditVm
        updates[vm.id].canUserManipulateSnapshots = !!existingVm.canUserManipulateSnapshots
        updates[vm.id].canUserEditVmStorage = !!existingVm.canUserEditVmStorage
      }
    })

    let st = state.mergeIn(['vms'], Immutable.fromJS(updates))

    const vmsIds = Object.keys(updates)
    st = st.set('missedVms', st.get('missedVms').subtract(vmsIds))

    return st
  },
  [REMOVE_VMS] (state, { payload: { vmIds } }) {
    const mutable = state.asMutable()
    vmIds.forEach(vmId => mutable.deleteIn([ 'vms', vmId ]))
    mutable.update('missedVms', missedVms => missedVms.union(vmIds))
    return mutable.asImmutable()
  },
  [REMOVE_MISSING_VMS] (state, { payload: { vmIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'vms', idsToPreserve: vmIdsToPreserve })
  },

  [SET_VM_DISKS] (state, { payload: { vmId, disks } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'disks'], Immutable.fromJS(disks)) // deep immutable
    } else { // fail, if VM not found
      console.error(`vms.setVmDisks() reducer: vmId ${vmId} not found`)
    }
    return state
  },
  [UPDATE_VM_DISK] (state, { payload: { vmId, disk } }) {
    if (state.getIn(['vms', vmId])) {
      const existing = state.getIn(['vms', vmId, 'disks']).findEntry(d => d.get('id') === disk.id)
      if (existing) {
        state = state.mergeDeepIn(['vms', vmId, 'disks', existing[0]], Immutable.fromJS(disk))
      }
    }
    return state
  },

  [SET_VM_SNAPSHOTS] (state, { payload: { vmId, snapshots } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'snapshots'], Immutable.fromJS(snapshots)) // deep immutable
    }

    console.error(`vms.setVmSnapshots() reducer: vmId ${vmId} not found`)
    return state
  },
  [UPDATE_VM_SNAPSHOT] (state, { payload: { vmId, snapshot } }) {
    if (state.getIn(['vms', vmId])) {
      const snapshotForUpdate = state.getIn(['vms', vmId, 'snapshots']).findIndex((s) => s.get('id') === snapshot.id)
      if (snapshotForUpdate > -1) {
        return state.updateIn(['vms', vmId, 'snapshots', snapshotForUpdate], (s) => s
          .set('description', snapshot.description)
          .set('type', snapshot.type)
          .set('status', snapshot.status)
          .set('persistMemoryState', snapshot.persistMemoryState)) // deep immutable
      }
      return state
    }

    console.error(`vms.setVmSnapshots() reducer: vmId ${vmId} not found`)
    return state
  },

  [SET_VM_NICS] (state, { payload: { vmId, nics } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'nics'], Immutable.fromJS(nics)) // deep immutable
    } else { // fail, if VM not found
      console.error(`vms.setVmNics() reducer: vmId ${vmId} not found`)
    }
    return state
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

  [VM_ACTION_IN_PROGRESS] (state, { payload: { vmId, name, started } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'actionInProgress', name], started)
    }
    return state
  },

  [UPDATE_POOLS] (state, { payload: { pools } }) {
    const updates = {}
    pools.forEach(pool => {
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
    state = state.update('pools', pools => pools.map(pool => pool.set('vmsCount', 0)))

    state.get('vms').map(vm => {
      const poolId = vm.getIn(['pool', 'id'])
      if (poolId && state.getIn(['pools', poolId])) {
        // VM is in a known pool ... down VMs don't count against the user total unless it is a manual pool
        if (vm.get('status') !== 'down' || state.getIn(['pools', poolId, 'type']) === 'manual') {
          state = state.updateIn(['pools', poolId, 'vmsCount'], count => count + 1)
        }
      }
    })

    return state
  },

  [FAILED_EXTERNAL_ACTION] (state, { payload: { message, messageDescriptor, type, failedAction } }) {
    if (message && failedAction && failedAction.payload && failedAction.payload.vmId) {
      const vmId = failedAction.payload.vmId
      if (state.getIn(['vms', vmId])) {
        return state.setIn(['vms', vmId, 'lastMessage'], messageDescriptor || message)
      } else {
        console.error(`API reports an error associated to nonexistent VM ${vmId}, error`,
          { message, messageDescriptor, type, failedAction })
      }
    }

    return state
  },

  [SET_VM_ACTION_RESULT] (state, { payload: { vmId, correlationId, result } }) {
    if (!vmId) {
      return state.update('correlationResult', results => results.set(correlationId, result))
    }
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'actionResults', correlationId], result)
    }
    return state
  },

  [UPDATE_PAGING_DATA] (state, { payload: { vmsPage, vmsExpectMorePages, poolsPage, poolsExpectMorePages } }) {
    if (vmsPage) {
      state = state.set('vmsPage', vmsPage)
    }
    state = state.set('vmsExpectMorePages', vmsExpectMorePages)

    if (poolsPage) {
      state = state.set('poolsPage', poolsPage)
    }
    state = state.set('poolsExpectMorePages', poolsExpectMorePages)

    return state
  },

  [LOGOUT] (state) { // see the config() reducer
    return state.set('vms', Immutable.fromJS({}))
  },
  [SET_FILTERS] (state, { payload: { filters } }) { // see the config() reducer
    return state.set('filters', Immutable.fromJS(filters))
  },
  [SET_VM_SORT] (state, { payload: { sort } }) { // see the config() reducer
    return state.set('sort', Immutable.fromJS(sort))
  },
})

export default vms
export {
  initialState,
}
