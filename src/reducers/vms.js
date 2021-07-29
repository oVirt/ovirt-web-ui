import Immutable from 'immutable'

import * as C from '_/constants'
import { actionReducer } from './utils'
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
  [C.UPDATE_VMS] (state, {
    payload: {
      keepSubResources,
      vms,
      removeVmIds,
      pools,
      removePoolIds,
      pagingData,
    },
  }) {
    state = updateVms(state, vms, keepSubResources)

    if (removeVmIds && removeVmIds.length > 0) {
      state = removeVms(state, removeVmIds)
    }

    if (pools && pools.length > 0) {
      state = updatePools(state, pools)
    }

    if (removePoolIds && removePoolIds > 0) {
      state = removePools(state, removePoolIds)
    }

    state = updateVmsCountForPools(state)

    if (pagingData) {
      state = updatePagingData(state, pagingData)
    }

    return state
  },

  [C.SET_VM_DISKS] (state, { payload: { vmId, disks } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'disks'], Immutable.fromJS(disks)) // deep immutable
    } else { // fail, if VM not found
      console.error(`vms.setVmDisks() reducer: vmId ${vmId} not found`)
    }
    return state
  },

  [C.UPDATE_VM_DISK] (state, { payload: { vmId, disk } }) {
    if (state.getIn(['vms', vmId])) {
      const existing = state.getIn(['vms', vmId, 'disks']).findEntry(d => d.get('id') === disk.id)
      if (existing) {
        state = state.mergeDeepIn(['vms', vmId, 'disks', existing[0]], Immutable.fromJS(disk))
      }
    }
    return state
  },

  [C.SET_VM_SNAPSHOTS] (state, { payload: { vmId, snapshots } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'snapshots'], Immutable.fromJS(snapshots)) // deep immutable
    }

    console.error(`vms.setVmSnapshots() reducer: vmId ${vmId} not found`)
    return state
  },

  [C.UPDATE_VM_SNAPSHOT] (state, { payload: { vmId, snapshot } }) {
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

  [C.SET_VM_NICS] (state, { payload: { vmId, nics } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'nics'], Immutable.fromJS(nics)) // deep immutable
    } else { // fail, if VM not found
      console.error(`vms.setVmNics() reducer: vmId ${vmId} not found`)
    }
    return state
  },

  [C.SET_VM_SESSIONS] (state, { payload: { vmId, sessions } }) {
    let consoleInUse = false
    for (const i in sessions) {
      if (sessions[i].consoleUser) {
        consoleInUse = true
        break
      }
    }
    state = state.setIn(['vms', vmId, 'sessions'], Immutable.fromJS(sessions))
    return state.setIn(['vms', vmId, 'consoleInUse'], consoleInUse)
  },

  [C.VM_ACTION_IN_PROGRESS] (state, { payload: { vmId, name, started } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'actionInProgress', name], started)
    }
    return state
  },

  [C.POOL_ACTION_IN_PROGRESS] (state, { payload: { poolId, name, started } }) {
    return state.setIn(['pools', poolId, 'vm', 'actionInProgress', name], started)
  },

  [C.FAILED_EXTERNAL_ACTION] (state, { payload: { message, messageDescriptor, type, failedAction } }) {
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

  [C.SET_VM_ACTION_RESULT] (state, { payload: { vmId, correlationId, result } }) {
    if (!vmId) {
      return state.update('correlationResult', results => results.set(correlationId, result))
    }
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'actionResults', correlationId], result)
    }
    return state
  },

  [C.LOGOUT] (state) { // see the config() reducer
    return state.set('vms', Immutable.fromJS({}))
  },

  [C.SET_FILTERS] (state, { payload: { filters } }) { // see the config() reducer
    return state.set('filters', Immutable.fromJS(filters))
  },

  [C.SET_VM_SORT] (state, { payload: { sort } }) { // see the config() reducer
    return state.set('sort', Immutable.fromJS(sort))
  },
})

/**
 * Merge an array of VMs in to the current `vms`, optionally retaining VM sub resources.
 */
function updateVms (state, updatedVms, keepSubResources) {
  const updates = {}

  updatedVms.forEach(vm => {
    const existingVm = state.hasIn(['vms', vm.id]) ? state.getIn(['vms', vm.id]).toJS() : false

    updates[vm.id] = vm
    updates[vm.id].actionResults = (existingVm && existingVm.actionResults) || {}

    if (existingVm && keepSubResources) {
      updates[vm.id] = {
        ...updates[vm.id],
        ...pullVmSubResources(existingVm),
      }
    }
  })

  state = state.mergeIn(['vms'], Immutable.fromJS(updates))

  const vmsIds = Object.keys(updates)
  state = state.set('missedVms', state.get('missedVms').subtract(vmsIds))

  return state
}

/**
 * Pull the VM_FETCH_ADDITIONAL_DEEP values from a vm
 */
function pullVmSubResources (vm) {
  const subResources = {}

  // Only copy consoles if the VM does not already have any
  subResources.consoles = vm.consoles.length === 0 ? vm.consoles || [] : vm.consoles

  subResources.cdrom = vm.cdrom || { file: { id: '' } }
  subResources.disks = vm.disks || []
  subResources.nics = vm.nics || []
  subResources.sessions = vm.sessions || []
  subResources.snapshots = vm.snapshots || []
  subResources.statistics = vm.statistics || []

  subResources.permissions = vm.permissions || []
  subResources.userPermits = vm.userPermits || []
  subResources.canUserChangeCd = !!vm.canUserChangeCd
  subResources.canUserEditVm = !!vm.canUserEditVm
  subResources.canUserManipulateSnapshots = !!vm.canUserManipulateSnapshots
  subResources.canUserEditVmStorage = !!vm.canUserEditVmStorage

  return subResources
}

function removeVms (state, vmIds) {
  const mutable = state.asMutable()
  vmIds.forEach(vmId => mutable.deleteIn(['vms', vmId]))
  mutable.update('missedVms', missedVms => missedVms.union(vmIds))
  return mutable.asImmutable()
}

/**
 * Merge an array of Pools in to the current `pools`.
 */
function updatePools (state, updatedPools) {
  const updates = {}

  updatedPools.forEach(pool => {
    updates[pool.id] = pool
  })

  return state.mergeIn(['pools'], Immutable.fromJS(updates))
}

function removePools (state, poolIds) {
  const mutable = state.asMutable()
  poolIds.forEach(poolId => mutable.deleteIn(['pools', poolId]))
  return mutable.asImmutable()
}

/**
 * Update the `vmsCount` attribute for each Pool based on VM pool ids.
 */
function updateVmsCountForPools (state) {
  state = state.update('pools', pools => pools.map(pool => pool.set('vmsCount', 0)))

  state.get('vms').forEach(vm => {
    const vmPoolId = vm.getIn(['pool', 'id'])
    if (vmPoolId && state.getIn(['pools', vmPoolId])) {
      // VM is in a known pool ... down VMs don't count against the user total unless it is a manual pool
      if (vm.get('status') !== 'down' || state.getIn(['pools', vmPoolId, 'type']) === 'manual') {
        state = state.updateIn(['pools', vmPoolId, 'vmsCount'], count => count + 1)
      }
    }
  })

  return state
}

function updatePagingData (state, { vmsPage, vmsExpectMorePages, poolsPage, poolsExpectMorePages }) {
  if (vmsPage) {
    state = state.set('vmsPage', vmsPage)
  }
  state = state.set('vmsExpectMorePages', vmsExpectMorePages)

  if (poolsPage) {
    state = state.set('poolsPage', poolsPage)
  }
  state = state.set('poolsExpectMorePages', poolsExpectMorePages)

  return state
}

export default vms
export {
  initialState,
}
