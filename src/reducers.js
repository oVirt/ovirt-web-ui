import { combineReducers } from 'redux'
import Immutable from 'immutable'
import { logDebug, hidePassword } from './helpers';

// --- Vms reducer ---------------
function updateOrAddVm ({state, payload: {vm}}) {
  const vmPredicate = vm => vm.get('id') === vm.id
  const vmIndex = state.get('vms').findIndex(vmPredicate)
  if (vmIndex < 0) {
    return state.update('vms', vms => vms.push(Immutable.fromJS(vm)))
  } else {
    logDebug(`--- TODO: The vms(UPDATE_VM) reducer is not implemented for update`)
    // TODO: implement update if needed
    return state
  }
}

function updateVmIcon ({state, payload: {vmId, icon, type}}) {
  // TODO: use seq
  const vmPredicate = vm => vm.get('id') === vmId
  const vm = state.get('vms').find(vmPredicate)
  const updatedVm = vm.setIn(['icons', type, 'mediaType'], icon.media_type).setIn(['icons', type, 'content'], icon.data)
  return state.update('vms', vms => vms.set(vms.findIndex(vmPredicate), updatedVm))
}

function vms (state, action) {
  state = state ? state : Immutable.fromJS({vms: [], selected: undefined, loadInProgress: true})
  logDebug(`The 'vms' reducer action=${JSON.stringify(hidePassword({action}))}`)

  switch (action.type) {
    case 'UPDATE_VM':
      return updateOrAddVm({state, payload: action.payload})
    case 'UPDATE_VM_ICON':
      return updateVmIcon({state, payload: action.payload})
    case 'SELECT_VM_DETAIL':
      return state.set('selected', action.payload.vmId)
    case 'CLOSE_VM_DETAIL':
      return state.delete('selected')
    case 'LOGOUT': // see config() reducer
      return state.update('vms', vms => vms.clear() )
    case 'SET_LOAD_IN_PROGRESS':
      return state.set('loadInProgress', action.payload.value)
    default:
      return state
  }
}

// --- AuditLog reducer ---------
function addAuditLogEntry ({state, message, type='ERROR', failedAction}) {
  // TODO: use seq
  return state.set('unread', true).update('records', records => records.push({
    message,
    type,
    failedAction,
    time: Date.now()
  }))
}

function auditLog (state, action) {
  state = state ? state : Immutable.fromJS({records: [], unread: false, show: false})
  // logDebug(`The 'auditLog' reducer action=${JSON.stringify(hidePassword({action}))}`)
  switch (action.type) {
    case 'FAILED_EXTERNAL_ACTION':
      return addAuditLogEntry({state, message: action.payload.message, type: action.payload.type, failedAction: action.payload.action})
    case 'LOGIN_FAILED': // see config() reducer
      return addAuditLogEntry({state, message: action.payload.message, type: action.payload.errorCode})
    case 'SHOW_AUDIT_LOG':
      return state.set('show', true).set('unread', false) // Object.assign({}, state, {show: true})
    case 'HIDE_AUDIT_LOG':
      return state.set('show', false) // return Object.assign({}, state, {show: false})
    default:
      return state
  }
}

// --- Config reducer -----------
function logout ({state}) {
  // TODO: use seq
  return state.delete('loginToken').deleteIn(['user', 'name'])
}

function config (state, action) {
  state = state ? state : Immutable.fromJS({loginToken: undefined, user: {name: undefined}})
  // logDebug(`The 'config' reducer action=${JSON.stringify(hidePassword({action}))}`)
  switch (action.type) {
    case 'LOGIN_SUCCESSFUL':
      return state.merge({loginToken: action.payload.token, user: {name: action.payload.username}})
    case 'LOGIN_FAILED': // see auditLog() reducer
      return logout({state})
    case 'LOGOUT': // see vms() reducer
      return logout({state})
    default:
      return state
  }
}

// ------------------------------
export default combineReducers({
  config,
  vms,
  auditLog
})
