import { combineReducers } from 'redux'
import Immutable from 'immutable'

import {logDebug, hidePassword} from 'ovirt-ui-components'

// --- Vms reducer ---------------
function updateOrAddVm({state, payload: {vm}}) {
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

function updateVmIcon({state, payload: {vmId, icon, type}}) {
    // TODO: use seq
    const vmPredicate = vm => vm.get('id') === vmId
    const vm = state.get('vms').find(vmPredicate)
    const updatedVm = vm.setIn(['icons', type, 'mediaType'], icon.media_type).setIn(['icons', type, 'content'], icon.data)
    return state.update('vms', vms => vms.set(vms.findIndex(vmPredicate), updatedVm))
}

function failedExternalActionVmMessage({state, payload}) {
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

            const vmPredicate = vm => vm.get('id') === vmId
            const vm = state.get('vms').find(vmPredicate)
            const updatedVm = vm.set('lastMessage', payload.message)
            return state.update('vms', vms => vms.set(vms.findIndex(vmPredicate), updatedVm))
        }
    }
    return state
}

function vms(state, action) {
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
            return state.update('vms', vms => vms.clear())
        case 'SET_LOAD_IN_PROGRESS':
            return state.set('loadInProgress', action.payload.value)
        case 'FAILED_EXTERNAL_ACTION': // see the auditLog() reducer
            return failedExternalActionVmMessage({state, payload: action.payload})
        default:
            return state
    }
}

// --- AuditLog reducer ---------
function addAuditLogEntry({state, message, type='ERROR', failedAction}) {
    // TODO: use seq
    return state.set('unread', true).update('records', records => records.push({
        message,
        type,
        failedAction,
        time: Date.now()
    }))
}

function auditLog(state, action) {
    state = state ? state : Immutable.fromJS({records: [], unread: false, show: false})
    // logDebug(`The 'auditLog' reducer action=${JSON.stringify(hidePassword({action}))}`)
    switch (action.type) {
        case 'FAILED_EXTERNAL_ACTION': // see the vms() reducer
            return addAuditLogEntry({
                state,
                message: action.payload.message,
                type: action.payload.type,
                failedAction: action.payload.action
            })
        case 'LOGIN_FAILED': // see the config() reducer
            return addAuditLogEntry({state, message: action.payload.message, type: action.payload.errorCode})
        case 'CLEAR_AUDITLOG_MSGS':
            return state.set('unread', false).update('records', records => records.clear())
        default:
            return state
    }
}

// --- Config reducer -----------
function logout({state}) {
    // TODO: use seq
    return state.delete('loginToken').deleteIn(['user', 'name'])
}

function config(state, action) {
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
