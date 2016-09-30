import { combineReducers } from 'redux'
import { logDebug, hidePassword } from './helpers';

// --- helpers -------------------
function getFirstIndexOfVm(state, field, value) {
  return state.findIndex(e => {
    return e[field] === value;
  });
}

// --- Vms reducer ---------------
function updateVm ({vms, vm}) {
  const index = vm.id ? getFirstIndexOfVm(vms, 'id', vm.id) : getFirstIndexOfVm(vms, 'name', vm.name)
  if (index < 0) { // not found --> add
    return [...vms, vm];
  }

  // update by merging
  const updatedVm = Object.assign({}, vms[index], vm)

  return vms.slice(0, index)
    .concat(updatedVm)
    .concat(vms.slice(index + 1));
}

function updateVmIcon ({vms, payload: {vmId, icon, type}}) {
  logDebug(`updateVmIcon() starts: `)

  const index = getFirstIndexOfVm(vms, 'id', vmId)
  if (index >= 0) {
    const updatedVm = Object.assign({}, vms[index])
    updatedVm.icons[type] = Object.assign({}, updatedVm.icons[type]);

    updatedVm.icons[type].mediaType = icon.media_type
    updatedVm.icons[type].content = icon.data  // TODO: think a little bit more about storing image content into the internalVm ...

    return vms.slice(0, index)
        .concat(updatedVm)
        .concat(vms.slice(index + 1))
  }

  return vms
}

// --- AuditLog reducer ---------
function addAuditLogEntry ({state, message, type='ERROR', failedAction}) {
  const newState = Object.assign({}, state)
  newState.unread = true
  newState.records = [...state.records, {
    message,
    type,
    failedAction,
    time: Date.now()
  }]
  return newState
}

// -------------------------------
function vms (state = {vms: [], selectedVm: undefined}, action) {
  logDebug(`The 'vms' reducer action=${JSON.stringify(hidePassword({action}))}`)

  switch (action.type) {
    case 'UPDATE_VM':
      return Object.assign({}, state, {vms: updateVm({vms: state.vms, vm: action.payload.vm})})
    case 'UPDATE_VM_ICON':
      return Object.assign({}, state, {vms: updateVmIcon({vms: state.vms, payload: action.payload})})
    case 'SELECT_VM_DETAIL':
      return Object.assign({}, state, {selected: action.payload.vm})
    case 'CLOSE_VM_DETAIL':
      return Object.assign({}, state, {selected: null})
    case 'LOGOUT': // see config() reducer
      return {vms: []}
    default:
      return state
  }
}

function logout ({state}) {
  const newState = Object.assign({}, state)
  newState['loginToken'] = undefined
  newState.user.name = undefined
  return newState
}

function config (state = {loginToken: undefined, user: {name: undefined}}, action) {
  // logDebug(`The 'config' reducer action=${JSON.stringify(hidePassword({action}))}`)
  switch (action.type) {
    case 'LOGIN_SUCCESSFUL':
      return Object.assign({}, state, {loginToken: action.payload.token, user: {name: action.payload.username}})
    case 'LOGIN_FAILED': // see auditLog() reducer
      return logout({state})
    case 'LOGOUT': // see vms() reducer
      return logout({state})
    default:
      return state
  }
}

function auditLog (state = {records: [], unread: false, show: false}, action) {
  // logDebug(`The 'auditLog' reducer action=${JSON.stringify(hidePassword({action}))}`)
  switch (action.type) {
    case 'FAILED_EXTERNAL_ACTION':
      return addAuditLogEntry({state, message: action.payload.message, type: action.payload.type, failedAction: action.payload.action})
    case 'LOGIN_FAILED': // see config() reducer
      return addAuditLogEntry({state, message: action.payload.message, type: action.payload.errorCode})
    case 'SHOW_AUDIT_LOG':
      return Object.assign({}, state, {show: true})
    case 'HIDE_AUDIT_LOG':
      return Object.assign({}, state, {show: false})
    default:
      return state
  }
}

export default combineReducers({
  config,
  vms,
  auditLog
})


/* import cockpit from 'cockpit';
 import { VMS_CONFIG } from "./config.es6";

 // --- compatibility hack for IE
 if (!Array.prototype.findIndex) {
 Array.prototype.findIndex = function(predicate) {
 if (this === null) {
 throw new TypeError('Array.prototype.findIndex called on null or undefined');
 }
 if (typeof predicate !== 'function') {
 throw new TypeError('predicate must be a function');
 }
 var list = Object(this);
 var length = list.length >>> 0;
 var thisArg = arguments[1];
 var value;

 for (var i = 0; i < length; i++) {
 value = list[i];
 if (predicate.call(thisArg, value, i, list)) {
 return i;
 }
 }
 return -1;
 };
 }

 // --- compatibility hack for PhantomJS
 if (typeof Object.assign != 'function') {
 Object.assign = function(target) {
 'use strict';
 if (target === null) {
 throw new TypeError('Cannot convert undefined or null to object');
 }

 target = Object(target);
 for (var index = 1; index < arguments.length; index++) {
 var source = arguments[index];
 if (source !== null) {
 for (var key in source) {
 if (Object.prototype.hasOwnProperty.call(source, key)) {
 target[key] = source[key];
 }
 }
 }
 }
 return target;
 };
 }
 */
