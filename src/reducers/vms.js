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
  SET_FILTERS,
  SET_PAGE,
  SET_VM_SORT,
  SET_VM_ACTION_RESULT,
  SET_VM_CDROM,
  SET_VM_CONSOLES,
  SET_VM_DISKS,
  SET_VM_NICS,
  SET_VM_SESSIONS,
  SET_VM_SNAPSHOTS,
  UPDATE_POOLS,
  UPDATE_VM_SNAPSHOT,
  UPDATE_VMPOOLS_COUNT,
  UPDATE_VM_DISK,
  UPDATE_VMS,
  VM_ACTION_IN_PROGRESS,
} from '_/constants'
import { actionReducer, removeMissingItems } from './utils'
import { sortFields } from '_/utils'

const EMPTY_MAP = Immutable.fromJS({})
const EMPTY_ARRAY = Immutable.fromJS([])

const initialState = Immutable.fromJS({
  vms: {},
  pools: {},
  filters: EMPTY_MAP,
  sort: { ...sortFields[0], isAsc: true },

  page: 1,

  missedVms: Immutable.Set(),

  /**
   * true ~ we need to fetch further vms and pools
   * false ~ all visible entities already fetched
   */
  notAllPagesLoaded: true,

  correlationResult: {},
})

const vms = actionReducer(initialState, {
  [UPDATE_VMS] (state, { payload: { vms, copySubResources, page } }) {
    const updates = {}

    vms.forEach(vm => {
      if (!state.getIn(['vms', vm.id])) {
        state = state.set('notAllPagesLoaded', true)
      }

      updates[vm.id] = vm
      updates[vm.id].actionResults = state.getIn(['vms', vm.id, 'actionResults'], EMPTY_MAP).toJS()

      if (copySubResources) {
        updates[vm.id].cdrom = state.getIn(['vms', vm.id, 'cdrom'], Immutable.fromJS({ file: { id: '' } })).toJS()
        updates[vm.id].consoles = vm.consoles.length === 0
          ? state.getIn(['vms', vm.id, 'consoles'], EMPTY_ARRAY).toJS()
          : vm.consoles
        updates[vm.id].disks = state.getIn(['vms', vm.id, 'disks'], EMPTY_ARRAY).toJS()
        updates[vm.id].nics = state.getIn(['vms', vm.id, 'nics'], EMPTY_ARRAY).toJS()
        updates[vm.id].sessions = state.getIn(['vms', vm.id, 'sessions'], EMPTY_ARRAY).toJS()
        updates[vm.id].snapshots = state.getIn(['vms', vm.id, 'snapshots'], EMPTY_ARRAY).toJS()
        updates[vm.id].statistics = state.getIn(['vms', vm.id, 'statistics'], EMPTY_MAP).toJS()

        updates[vm.id].permissions = state.getIn(['vms', vm.id, 'permissions'], EMPTY_ARRAY).toJS()
        updates[vm.id].userPermits = state.getIn(['vms', vm.id, 'userPermits'], EMPTY_ARRAY).toJS()
        updates[vm.id].canUserChangeCd = state.getIn(['vms', vm.id, 'canUserChangeCd'], true)
        updates[vm.id].canUserEditVm = state.getIn(['vms', vm.id, 'canUserEditVm'], false)
        updates[vm.id].canUserManipulateSnapshots = state.getIn(['vms', vm.id, 'canUserManipulateSnapshots'], false)
        updates[vm.id].canUserEditVmStorage = state.getIn(['vms', vm.id, 'canUserEditVmStorage'], false)
      }
    })

    let st = state.mergeIn(['vms'], Immutable.fromJS(updates))
    if (page) {
      st = st.set('page', page)
    }

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

  [SET_VM_CDROM] (state, { payload: { vmId, cdrom } }) {
    if (state.getIn(['vms', vmId])) {
      return state.setIn(['vms', vmId, 'cdrom'], Immutable.fromJS(cdrom)) // deep immutable
    } else { // fail, if VM not found
      console.error(`vms[${SET_VM_CDROM}] reducer: vmId ${vmId} not found`)
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
      if (
        vm.getIn(['pool', 'id']) &&
        (
          vm.get('status') !== 'down' ||
          state.getIn(['pools', vm.getIn(['pool', 'id']), 'type']) === 'manual'
        )
      ) {
        state = state.updateIn(['pools', vm.getIn(['pool', 'id']), 'vmsCount'], count => count + 1)
      }
    })
    return state
  },

  [FAILED_EXTERNAL_ACTION] (state, { payload: { message, shortMessage, type, failedAction } }) {
    if (message && failedAction && failedAction.payload && failedAction.payload.vmId) {
      const vmId = failedAction.payload.vmId
      if (state.getIn(['vms', vmId])) {
        return state.setIn(['vms', vmId, 'lastMessage'], shortMessage || message)
      } else {
        console.error(`API reports an error associated to nonexistent VM ${vmId}, error`,
          { message, shortMessage, type, failedAction })
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

  [SET_PAGE] (state, { payload: { page } }) {
    return state.set('page', page)
  },
  [SET_CHANGED] (state, { payload: { value } }) {
    return state.set('notAllPagesLoaded', value)
  },
  [LOGOUT] (state) { // see the config() reducer
    return state.set('vms', EMPTY_MAP)
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
