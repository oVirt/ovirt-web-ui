import { combineReducers } from 'redux'
import { logDebug, hidePassword } from './helpers';

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

/*
// --- helpers -------------------
function getFirstIndexOfVm(state, field, value) {
  return state.findIndex(e => {
    return e[field] === value;
  });
}

function getVmForUpdateByName (state, vmName, actionName) {
  const index = getFirstIndexOfVm(state, 'name', vmName);
  if (index < 0) {
    logDebug(`${actionName}: vm.name not found: ${vmName}`);
    return {
      // vmForUpdate is not defined here
      newState: state
    };
  }

  const updatedVm = Object.assign({}, state[index]);
  return {
    vmForUpdate: updatedVm,
    newState: state.slice(0, index).concat(updatedVm).concat(state.slice(index + 1))
  };
}

// --- reducers ------------------
function config (state, action) {
  state = state ? state : {
    provider: null,
    refreshInterval: VMS_CONFIG.DefaultRefreshInterval
  };

  switch (action.type) {
    case 'SET_PROVIDER':
      return Object.assign({}, state, {provider: action.provider});
    case 'SET_REFRESH_INTERVAL':
      const newState = Object.assign({}, state);
      newState.refreshInterval = action.refreshInterval;
      return newState;
    default:
      return state;
  }
}

function vms (state, action) {
  state = state ? state : [];

  logDebug('reducer vms: action=' + JSON.stringify(action));
  let index;

  switch (action.type) {
    case 'UPDATE_ADD_VM': {
      index = action.vm.id ? getFirstIndexOfVm(state, 'id', action.vm.id) : getFirstIndexOfVm(state, 'name', action.vm.name);
      if (index < 0) { // add
        return [...state, action.vm];
      }

      // update by merging
      timeSampleUsageData(action.vm, state[index]);
      const updatedVm = Object.assign({}, state[index], action.vm);

      return state.slice(0, index)
        .concat(updatedVm)
        .concat(state.slice(index + 1));
    }
    case 'DELETE_UNLISTED_VMS': {
      return state.filter(vm => {
        return action.vmNames.indexOf(vm.name) >= 0;
      });
    }
    case 'HOSTVMSLIST_TOGGLE_VM_EXPAND': {
      const copy = getVmForUpdateByName(state, action.name, 'HOSTVMSLIST_TOGGLE_VM_EXPAND');
      if (copy.vmForUpdate) {
        copy.vmForUpdate["visualExpanded"] = !copy.vmForUpdate["visualExpanded"];
      }
      return copy.newState;
    }
    case 'HOSTVMSLIST_SHOW_VM_SUBTAB': {
      const copy = getVmForUpdateByName(state, action.name, 'HOSTVMSLIST_SHOW_VM_SUBTAB');
      if (copy.vmForUpdate) {
        copy.vmForUpdate["visualSubtab"] = action.order;
      }
      return copy.newState;
    }
    default: // by default all reducers should return initial state on unknown actions
      return state;
  }
}

function timeSampleUsageData(newVmRecord, previousVmRecord) {
  logDebug(`timeSampleUsageData() called\nnewVmRecord: ${JSON.stringify(newVmRecord)}\noldVmRecord: ${JSON.stringify(previousVmRecord)}`);
  if (newVmRecord['actualTimeInMs']) { // new usage data are provided
    if (previousVmRecord['actualTimeInMs']) { // diff can be computed
      const timeDiff = (newVmRecord.actualTimeInMs - previousVmRecord.actualTimeInMs) * 1000000; // in nanosecs
      if (timeDiff <= 0) {
        logDebug(`-- timeSampleUsageData(): no time difference`);
        return ;
      }
      const cpuTimeDiff = newVmRecord.cpuTime - previousVmRecord.cpuTime; // in nanosecs

      // store computed actual usage stats
      newVmRecord.cpuUsage = (100 * cpuTimeDiff / timeDiff).toFixed(1);
      logDebug(`-- timeSampleUsageData(): actualTime(${newVmRecord['actualTimeInMs']}) - previousTime(${previousVmRecord['actualTimeInMs']})=${timeDiff},
        actualCpuTime(${newVmRecord.cpuTime}) - previousCpuTime(${previousVmRecord.cpuTime})=${cpuTimeDiff},
        cpuUsage=${newVmRecord.cpuUsage}%`);

      return ;
    }
  }

  newVmRecord.cpuUsage = 0;
}
*/

// --- helpers -------------------
function getFirstIndexOfVm(state, field, value) {
  return state.findIndex(e => {
    return e[field] === value;
  });
}

// --- Vms reducer ---------------
function updateVm ({vms, vm}) {
  const index = vm.id ? getFirstIndexOfVm(vms, 'id', vm.id) : getFirstIndexOfVm(vms, 'name', vm.name);
  if (index < 0) { // not found --> add
    return [...vms, vm];
  }

  // update by merging
  const updatedVm = Object.assign({}, vms[index], vm);

  return vms.slice(0, index)
    .concat(updatedVm)
    .concat(vms.slice(index + 1));
}

// --- AuditLog reducer ---------
function addAuditLogEntry ({state, message, type='ERROR', failedAction}) {
  return [...state, {
    message,
    type,
    failedAction,
    time: Date.now()
  }]

}

// -------------------------------
function vms (state = {vms: [], selectedVm: undefined}, action) {
  logDebug(`The 'vms' reducer action=${JSON.stringify(hidePassword({action}))}`);

  switch (action.type) {
    case 'UPDATE_VM':
      return Object.assign({}, state, {vms: updateVm({vms: state.vms, vm: action.payload.vm})})
    case 'SELECT_VM_DETAIL':
      return Object.assign({}, state, {selected: action.payload.vm})
    case 'CLOSE_VM_DETAIL':
      return Object.assign({}, state, {selected: null})
    default:
      return state
  }
}

function config (state = {}, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESSFUL':
      return Object.assign({}, state, {loginToken: action.payload.token})
    case 'LOGIN_FAILED':
      const newState = Object.assign({}, state)
      newState['loginToken'] = undefined
      return newState
    default:
      return state
  }
}

function auditLog (state = [], action) {
  switch (action.type) {
    case 'FAILED_EXTERNAL_ACTION':
      return addAuditLogEntry({state, message: action.payload.message, type: 'ERROR', failedAction: action.payload.action})
    default:
      return state
  }
}

export default combineReducers({
  config,
  vms,
  auditLog
})
