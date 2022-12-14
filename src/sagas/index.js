import {
  all,
  call,
  put,
  takeEvery,
  takeLatest,
  throttle,
  select,
} from 'redux-saga/effects'
import { push } from 'connected-react-router'

import Api, { Transforms } from '_/ovirtapi'
import { saveToLocalStorage } from '_/storage'

import sagasConsole from './console'
import sagasOptions from './options'
import sagasRefresh from './background-refresh'
import sagasDisks from './disks'
import sagasLogin from './login'
import sagasVmChanges from './vmChanges'
import sagasVmSnapshots from '_/components/VmDetails/cards/SnapshotsCard/sagas'

import {
  updateVms,
  setVmSnapshots,

  setServerMessages,
  dismissUserMessage,

  setVmNics,
  removeActiveRequest,
  getVmCdRom,
  setVmsFilters,
} from '_/actions'

import {
  callExternalAction,
  curryEntityPermissionsToUserPermits,
  delay,
  doCheckTokenExpired,
  mapCpuOptions,
} from './utils'

import { fetchUnknownIcons } from './osIcons'

import {
  ADD_VM_NIC,
  CHECK_TOKEN_EXPIRED,
  CLEAR_USER_MSGS,
  DELAYED_REMOVE_ACTIVE_REQUEST,
  DELETE_VM_NIC,
  DISMISS_EVENT,
  EDIT_VM_NIC,
  GET_ALL_EVENTS,
  GET_BY_PAGE,
  GET_POOL,
  GET_POOLS,
  GET_VM,
  GET_VMS,
  NAVIGATE_TO_VM_DETAILS,
  SAVE_FILTERS,
} from '_/constants'

import {
  canUserChangeCd,
  canUserEditDisk,
  canUserEditVm,
  canUserEditVmStorage,
  canUserManipulateSnapshots,
} from '_/utils'
import AppConfiguration from '_/config'

const VM_FETCH_ADDITIONAL_DEEP = [
  'cdroms',
  'disk_attachments.disk.permissions',
  'graphics_consoles',
  'nics.reporteddevices',
  'permissions',
  'sessions',
  'snapshots',
  'statistics',
]

const VM_FETCH_ADDITIONAL_SHALLOW = [
  'graphics_consoles', // for backward compatibility only (before 4.4.7)
]

export const EVERYONE_GROUP_ID = 'eee00000-0000-0000-0000-123456789eee'

export function* transformAndPermitVm (vm) {
  const _entityPermissionsToUserPermits = yield curryEntityPermissionsToUserPermits()

  const internalVm = Transforms.VM.toInternal({ vm })
  internalVm.userPermits = _entityPermissionsToUserPermits(internalVm)

  internalVm.canUserChangeCd = canUserChangeCd(internalVm.userPermits)
  internalVm.canUserEditVm = canUserEditVm(internalVm.userPermits)
  internalVm.canUserManipulateSnapshots = canUserManipulateSnapshots(internalVm.userPermits)
  internalVm.canUserEditVmStorage = canUserEditVmStorage(internalVm.userPermits)

  // Map VM attribute derived config values to the VM. The mappings are based on the
  // VM's custom compatibility version and CPU architecture.
  const customCompatVer = internalVm.customCompatibilityVersion
  if (customCompatVer) {
    internalVm.cpuOptions = yield mapCpuOptions(customCompatVer, internalVm.cpu.arch)
  } else {
    internalVm.cpuOptions = null
  }

  // Permit disks fetched and transformed along with the VM
  for (const disk of internalVm.disks) {
    disk.userPermits = _entityPermissionsToUserPermits(disk)
    disk.canUserEditDisk = canUserEditDisk(disk.userPermits)
  }

  return internalVm
}

/**
 * Fetch VMs and Pools in a paged manner, and track if any more pages are (expected to
 * be) available,
 */
export function* fetchByPage () {
  const {
    vmsPage,
    vmsExpectMorePages,
    poolsPage,
    poolsExpectMorePages,
  } = yield select(({ vms }) => ({
    vmsPage: vms.get('vmsPage'),
    vmsExpectMorePages: !!vms.get('vmsExpectMorePages'),
    poolsPage: vms.get('poolsPage'),
    poolsExpectMorePages: !!vms.get('poolsExpectMorePages'),
  }))

  //
  // If more pages are expected, fetch the next page
  // If no more pages are expected, skip the fetch
  //
  const count = AppConfiguration.pageLimit
  const {
    vms: { internalVms: vms },
    pools: { internalPools: pools },
  } = yield all({
    vms: vmsExpectMorePages
      ? call(fetchVms, { payload: { count, page: vmsPage + 1 } })
      : { internalVms: null },

    pools: poolsExpectMorePages
      ? call(fetchPools, { payload: { count, page: poolsPage + 1 } })
      : { internalPools: null },
  })

  // Put the new page of data to the store
  yield put(updateVms({
    keepSubResources: true,
    vms,
    pools,

    //
    // Bump the VMs / Pools page if a new page was fetched
    //
    vmsPage: vmsExpectMorePages ? vmsPage + 1 : undefined,
    poolsPage: poolsExpectMorePages ? poolsPage + 1 : undefined,
  }))

  if (vms) {
    yield fetchUnknownIcons({ vms })
  }
}

export function* fetchVms ({ payload: { count, page, shallowFetch = true } }) {
  const additional = shallowFetch ? VM_FETCH_ADDITIONAL_SHALLOW : VM_FETCH_ADDITIONAL_DEEP
  const apiVms = yield callExternalAction(Api.getVms, { payload: { count, page, additional } })

  if (!apiVms || apiVms.error) {
    return { internalVms: null }
  }

  if (!apiVms.vm) {
    // no VMs
    return { internalVms: [] }
  }

  const internalVms = []
  for (const apiVm of apiVms.vm) {
    const internalVm = yield transformAndPermitVm(apiVm)
    internalVms.push(internalVm)
  }

  // NOTE: No need to fetch the current=true cdrom info at this point. The cdrom info
  //       is needed on the VM details page and `fetchSingleVm` is called upon entry
  //       to the details page. The `fetchSingleVm` fetch includes loading the
  //       appropriate cdrom info based on the VM's state. See `fetchSingleVm` for more
  //       details.

  return { internalVms }
}

function* fetchAndPutVms (action) {
  const { internalVms } = yield fetchVms(action)

  if (internalVms) {
    yield put(updateVms({ vms: internalVms, keepSubResources: action.payload.shallowFetch }))
    yield fetchUnknownIcons({ vms: internalVms })
  }
}

export function* fetchSingleVm (action) {
  const { vmId, shallowFetch } = action.payload

  action.payload.additional = shallowFetch ? VM_FETCH_ADDITIONAL_SHALLOW : VM_FETCH_ADDITIONAL_DEEP
  const vm = yield callExternalAction(Api.getVm, action, true)
  if (vm?.error) {
    return { vmId, error: vm.error }
  }

  const internalVm = yield transformAndPermitVm(vm)

  // If the VM is running, we want to display the current=true cdrom info. Due
  // to an API restriction, current=true cdrom info cannot currently (Aug-2018)
  // be accessed via the additional fetch list on the VM. Fetch it directly.
  if (!shallowFetch && internalVm.status === 'up') {
    internalVm.cdrom = yield fetchVmCdRom({ vmId: internalVm.id, current: true })
  }

  if (!shallowFetch) {
    yield parallelFetchAndPopulateSnapshotDisksAndNics(internalVm.id, internalVm.snapshots)
  }

  return { vmId, internalVm }
}

export function* fetchAndPutSingleVm (action) {
  const { internalVm, error } = yield fetchSingleVm(action)

  if (error) {
    if (error?.status === 404) {
      yield put(updateVms({ removeVmIds: [action.payload.vmId] }))
    }
  } else {
    yield put(updateVms({ vms: [internalVm], keepSubResources: action.payload.shallowFetch }))
    yield fetchUnknownIcons({ vms: [internalVm] })
  }
  return { internalVm, error }
}

export function* fetchPools (action) {
  const apiPools = yield callExternalAction(Api.getPools, action)

  if (!apiPools || apiPools.error) {
    return { internalPools: null }
  }

  if (!apiPools.vm_pool) {
    // no pools
    return { internalPools: [] }
  }

  return { internalPools: apiPools.vm_pool.map(pool => Transforms.Pool.toInternal({ pool })) }
}

function* fetchAndPutPools (action) {
  const { internalPools } = yield fetchPools(action)

  if (internalPools) {
    yield put(updateVms({ pools: internalPools }))
  }
}

export function* fetchSinglePool (action) {
  const pool = yield callExternalAction(Api.getPool, action, true)
  if (pool?.error) {
    return { poolId: action.payload.poolId, error: pool.error }
  }

  const internalPool = Transforms.Pool.toInternal({ pool })

  return { poolId: action.payload.poolId, internalPool }
}

function* fetchAndPutSinglePool (action) {
  const { internalPool, error } = yield fetchSinglePool(action)

  if (error) {
    if (error?.status === 404) {
      yield put(updateVms({ removePoolIds: [action.payload.poolId] }))
    }
  } else {
    yield put(updateVms({ pools: [internalPool] }))
  }
}

/*
 * Fetch a VM's cdrom configuration based on the status of the VM. A running VM's cdrom
 * info comes from "current=true" while a non-running VM's cdrom info comes from the
 * next_run/"current=false" API parameter.
 */
function* fetchVmCdRom ({ vmId, current = true }) {
  const cdrom = yield callExternalAction(Api.getCdRom, getVmCdRom({ vmId, current }))

  let cdromInternal = null
  if (cdrom) {
    cdromInternal = Transforms.CdRom.toInternal({ cdrom })
  }
  return cdromInternal
}

function* fetchVmNics ({ vmId }) {
  const nics = yield callExternalAction(Api.getVmNic, { type: 'GET_VM_NICS', payload: { vmId } })
  if (nics && nics.nic) {
    const nicsInternal = nics.nic.map(nic => Transforms.Nic.toInternal({ nic }))
    return nicsInternal
  }
  return []
}

export function* addVmNic (action) {
  const nic = yield callExternalAction(Api.addNicToVm, action)

  if (nic && nic.id) {
    const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
    yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
  }
}

function* deleteVmNic (action) {
  yield callExternalAction(Api.deleteNicFromVm, action)

  const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
  yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
}

function* editVmNic (action) {
  yield callExternalAction(Api.editNicInVm, action)

  const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
  yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
}

function* fetchAllEvents () {
  const { userId, userName } = yield select(state => ({
    userId: state.config.getIn(['user', 'id']),
    userName: `${state.config.getIn(['user', 'name'])}@${state.config.get('domain')}`,
  }))

  const events = yield callExternalAction(Api.events, { payload: {} })

  if (events.error || !Array.isArray(events.event)) {
    return
  }

  const internalEvents = events.event
    .filter(({ severity, user }) =>
      severity === 'error' && user && (user?.id === userId || user?.name === userName)
    )
    .map((event) => Transforms.Event.toInternal({ event }))
  yield put(setServerMessages({ messages: internalEvents }))
}

function* dismissEvent ({ payload: { event: { source, id: eventId } } }) {
  if (source === 'server') {
    const result = yield callExternalAction(Api.dismissEvent, { payload: { eventId } })

    if (result.status === 'complete') {
      yield fetchAllEvents()
    }
  } else {
    yield put(dismissUserMessage({ eventId }))
  }
}

function* clearEvents ({ payload: { records = [] } }) {
  // at this point selected events were removed from userMessages.records
  const sagaEvents = records
    .filter(({ source }) => source === 'server')
    .map(({ id: eventId }) => callExternalAction(Api.dismissEvent, { payload: { eventId } }))

  yield all(sagaEvents)

  yield fetchAllEvents()
}

export function* fetchVmSessions ({ vmId }) {
  const sessions = yield callExternalAction(Api.sessions, { payload: { vmId } })

  if (sessions && sessions.session) {
    return Transforms.VmSessions.toInternal({ sessions })
  }
  return []
}

function* saveFilters (actions) {
  const { filters } = actions.payload
  const userId = yield select(state => state.config.getIn(['user', 'id']))
  saveToLocalStorage(`vmFilters-${userId}`, JSON.stringify(filters))
  yield put(setVmsFilters({ filters }))
}

export function* fetchVmSnapshots ({ vmId }) {
  const snapshots = yield callExternalAction(Api.snapshots, { type: 'GET_VM_SNAPSHOT', payload: { vmId } })
  let snapshotsInternal = []

  if (snapshots && snapshots.snapshot) {
    snapshotsInternal = snapshots.snapshot.map(snapshot => Transforms.Snapshot.toInternal({ snapshot }))
    yield parallelFetchAndPopulateSnapshotDisksAndNics(vmId, snapshotsInternal)
  }

  yield put(setVmSnapshots({ vmId, snapshots: snapshotsInternal }))
}

/**
 * Setup all of the calls needed to fetch, transform and populate the disks and nics
 * for a set of VM snapshots.  To minimize wall clock time, all of the required fetches
 * are done in parallel.
 *
 * This technique is required since snapshot disks and nics are not currently (July-2021)
 * available via additional/follow param on the VM/snapshot fetch.  They need to be
 * fetched directly.
 *
 * NOTE: Looks like the `?follows=snapshots` returns the active and regular snapshots.
 *       The active snapshot does not contain links to disks and nics, but the regular
 *       ones do.  That is probably the reason why the VM REST API call with
 *       `?follows=snapshots.disks` fails.
 *
 * @param {string} vmId VM to work on
 * @param {*} snapshots Array of internal `SnapshotType` objects
 * @returns
 */
function* parallelFetchAndPopulateSnapshotDisksAndNics (vmId, snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return
  }

  const fetches = []
  for (const snapshot of snapshots.filter(snapshot => snapshot.type !== 'active')) {
    fetches.push(
      call(fetchVmSnapshotDisks, { vmId, snapshotId: snapshot.id }),
      call(fetchVmSnapshotNics, { vmId, snapshotId: snapshot.id })
    )
  }

  const results = yield all(fetches)

  for (const snapshot of snapshots.filter(snapshot => snapshot.type !== 'active')) {
    snapshot.disks = results.shift()
    snapshot.nics = results.shift()
  }
}

function* fetchVmSnapshotDisks ({ vmId, snapshotId }) {
  const disks = yield callExternalAction(Api.snapshotDisks, { payload: { vmId, snapshotId } }, true)
  let disksInternal = []
  if (disks?.disk) {
    disksInternal = disks.disk.map(disk => Transforms.DiskAttachment.toInternal({ disk }))
  }
  return disksInternal
}

function* fetchVmSnapshotNics ({ vmId, snapshotId }) {
  const nics = yield callExternalAction(Api.snapshotNics, { payload: { vmId, snapshotId } }, true)
  let nicsInternal = []
  if (nics?.nic) {
    nicsInternal = nics.nic.map((nic) => Transforms.Nic.toInternal({ nic }))
  }
  return nicsInternal
}

function* delayedRemoveActiveRequest ({ payload: requestId }) {
  yield delay(500)
  yield put(removeActiveRequest(requestId))
}

function* navigateToVmDetails ({ payload: { vmId } }) {
  yield put(push(`/vm/${vmId}`))
}

export function* rootSaga () {
  yield all([
    ...sagasLogin,
    ...sagasRefresh,

    takeEvery(CHECK_TOKEN_EXPIRED, doCheckTokenExpired),
    takeEvery(DELAYED_REMOVE_ACTIVE_REQUEST, delayedRemoveActiveRequest),

    throttle(100, GET_VMS, fetchAndPutVms),
    throttle(100, GET_POOLS, fetchAndPutPools),

    takeLatest(GET_ALL_EVENTS, fetchAllEvents),
    takeEvery(DISMISS_EVENT, dismissEvent),
    takeEvery(CLEAR_USER_MSGS, clearEvents),

    takeLatest(NAVIGATE_TO_VM_DETAILS, navigateToVmDetails),
    takeEvery(GET_VM, fetchAndPutSingleVm),
    takeEvery(GET_POOL, fetchAndPutSinglePool),

    throttle(100, GET_BY_PAGE, fetchByPage),

    takeEvery(ADD_VM_NIC, addVmNic),
    takeEvery(DELETE_VM_NIC, deleteVmNic),
    takeEvery(EDIT_VM_NIC, editVmNic),

    takeEvery(SAVE_FILTERS, saveFilters),

    // Sagas from Components
    ...sagasConsole,
    ...sagasDisks,
    ...sagasOptions,
    ...sagasVmChanges,
    ...sagasVmSnapshots,
  ])
}
