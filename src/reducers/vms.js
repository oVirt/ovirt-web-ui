import Immutable, { Map } from 'immutable'

import { logDebug, logError, hidePassword } from '../helpers'

function updateOrAddVm ({ state, payload: { vms, copySubResources } }) {
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
}

function removeVms ({ state, payload: { vmIds } }) {
  const mutable = state.asMutable()
  vmIds.forEach(vmId => mutable.deleteIn([ 'vms', vmId ]))
  return mutable.asImmutable()
}

/**
 *
 * @param state
 * @param vmIdsToPreserve array
 * @returns {*}
 */
function removeMissingVms ({ state, payload: { vmIdsToPreserve } }) {
  const newVms = vmIdsToPreserve
    .reduce((vms, vmId) => {
      const vm = state.getIn(['vms', vmId])
      if (vm) {
        vms.set(vmId, vm)
      }
      return vms
    }, Map().asMutable())
    .asImmutable()
  return state.set('vms', newVms)
}

function setVmDisks ({ state, payload: { vmId, disks } }) {
  if (state.getIn(['vms', vmId])) {
    return state.setIn(['vms', vmId, 'disks'], Immutable.fromJS(disks)) // deep immutable
  } else { // fail, if VM not found
    logError(`vms.setVmDisks() reducer: vmId ${vmId} not found`)
  }
  return state
}

function failedExternalActionVmMessage ({ state, payload }) {
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
}

/**
 * The Vms reducer
 *
 * @param state
 * @param action
 * @returns {*}
 */
function vms (state, action) {
  state = state || Immutable.fromJS({ vms: {}, loadInProgress: true })
  logDebug(`The 'vms' reducer action=${JSON.stringify(hidePassword({ action }))}`)

  switch (action.type) {
    case 'UPDATE_VMS':
      return updateOrAddVm({ state, payload: action.payload })
    case 'REMOVE_VMS':
      return removeVms({ state, payload: action.payload })
    case 'REMOVE_MISSING_VMS':
      return removeMissingVms({ state, payload: action.payload })
    case 'SET_VM_DISKS':
      return setVmDisks({ state, payload: action.payload })
    case 'VM_ACTION_IN_PROGRESS':
      return state.setIn(['vms', action.payload.vmId, 'actionInProgress', action.payload.name], action.payload.started)
    case 'SET_VM_CONSOLES':
      return state.setIn(['vms', action.payload.vmId, 'consoles'], Immutable.fromJS(action.payload.consoles))
    case 'LOGOUT': // see the config() reducer
      return state.set('vms', Immutable.fromJS({}))
    case 'SET_LOAD_IN_PROGRESS':
      return state.set('loadInProgress', action.payload.value)
    case 'FAILED_EXTERNAL_ACTION': // see the userMessages() reducer
      return failedExternalActionVmMessage({ state, payload: action.payload })
    default:
      return state
  }
}

export default vms
