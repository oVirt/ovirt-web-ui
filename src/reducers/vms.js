import Immutable, { Map } from 'immutable'
import { logError } from '../helpers'
import { actionReducer, removeMissingItems } from './utils'

const initialState = Immutable.fromJS({
  vms: {},
  loadInProgress: true,
})

const vms = actionReducer(initialState, {
  UPDATE_VMS (state, { payload: { vms, copySubResources } }) {
    const emptyMap = Map()
    const updates = {}
    vms.forEach(vm => {
      updates[vm.id] = vm
      if (copySubResources) {
        updates[vm.id].disks = state.getIn(['vms', vm.id, 'disks'], emptyMap).toJS()
        updates[vm.id].consoles = state.getIn(['vms', vm.id, 'consoles'], emptyMap).toJS()
      }
    })
    const imUpdates = Immutable.fromJS(updates)
    return state.mergeIn(['vms'], imUpdates)
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
  VM_ACTION_IN_PROGRESS (state, { payload: { vmId, name, started } }) {
    return state.setIn(['vms', vmId, 'actionInProgress', name], started)
  },
  SET_VM_CONSOLES (state, { payload: { vmId, consoles } }) {
    return state.setIn(['vms', vmId, 'consoles'], Immutable.fromJS(consoles))
  },
  LOGOUT (state) { // see the config() reducer
    return state.set('vms', Immutable.fromJS({}))
  },
  SET_LOAD_IN_PROGRESS (state, { payload: { value } }) {
    return state.set('loadInProgress', value)
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
          logError(`vms.updateVmIcon() reducer: vmId ${vmId} not found`)
        }
      }
    }
    return state
  },
})

export default vms
