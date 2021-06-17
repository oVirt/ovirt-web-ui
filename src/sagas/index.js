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

import sagasOptions from './options'
import sagasRefresh from './background-refresh'
import sagasDisks from './disks'
import sagasLogin from './login'
import sagasRoles from './roles'
import sagasStorageDomains from './storageDomains'
import sagasVmChanges from './vmChanges'
import sagasVmSnapshots from '_/components/VmDetails/cards/SnapshotsCard/sagas'

import {
  updatePagingData,
  setVmDisks,
  updateVms,
  removeVms,
  vmActionInProgress,

  getSingleVm,
  setUser,
  setVmSnapshots,

  setUserMessages,
  dismissUserMessage,

  getSinglePool,
  removePools,
  updatePools,
  updateVmsPoolsCount,
  poolActionInProgress,

  setVmNics,
  removeActiveRequest,
  getVmCdRom,
  setVmsFilters,
} from '_/actions'

import {
  callExternalAction,
  delay,
  doCheckTokenExpired,
  entityPermissionsToUserPermits,
  foreach,
  fetchPermits,
  mapCpuOptions,
  PermissionsType,
} from './utils'

import { fetchUnknownIcons } from './osIcons'

import {
  downloadVmConsole,
  getConsoleOptions,
  saveConsoleOptions,
  getRDPVm,
  openConsoleModal,
} from './console'

import {
  ADD_VM_NIC,
  CHECK_TOKEN_EXPIRED,
  CLEAR_USER_MSGS,
  DELAYED_REMOVE_ACTIVE_REQUEST,
  DELETE_VM_NIC,
  DISMISS_EVENT,
  DOWNLOAD_CONSOLE_VM,
  EDIT_VM_NIC,
  GET_ALL_EVENTS,
  GET_BY_PAGE,
  GET_CONSOLE_OPTIONS,
  GET_POOLS,
  GET_RDP_VM,
  GET_USER,
  GET_VMS,
  NAVIGATE_TO_VM_DETAILS,
  OPEN_CONSOLE_MODAL,
  SAVE_CONSOLE_OPTIONS,
  SAVE_FILTERS,
  SELECT_POOL_DETAIL,
  SELECT_VM_DETAIL,
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
  'disk_attachments.disk',
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
  const internalVm = Transforms.VM.toInternal({ vm })
  internalVm.userPermits = yield entityPermissionsToUserPermits(internalVm)

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

  return internalVm
}

function* putPermissionsInDisk (disk) {
  disk.permits = yield fetchPermits({ entityType: PermissionsType.DISK_TYPE, id: disk.id })
  disk.canUserEditDisk = canUserEditDisk(disk.permits)
  return disk
}

/**
 * Fetch VMs and Pools in a paged manner, and track if any more pages are (expected to
 * be) available,
 */
export function* fetchByPage () {
  const [
    vmsPage,
    vmsExpectMorePages,
    poolsPage,
    poolsExpectMorePages,
  ] = yield select(({ vms }) => [
    vms.get('vmsPage'), !!vms.get('vmsExpectMorePages'),
    vms.get('poolsPage'), !!vms.get('poolsExpectMorePages'),
  ])

  function* currentVmsIds ({ payload: { count, page } }) {
    const start = count * page
    const end = start + count
    return Array.from(yield select(state => state.vms.get('vms').keys())).slice(start, end)
  }

  function* currentPoolsIds ({ payload: { count, page } }) {
    const start = count * page
    const end = start + count
    return Array.from(yield select(state => state.vms.get('pools').keys())).slice(start, end)
  }

  //
  // If more pages are expected, fetch the next page and grab the ids fetched
  // If no more pages are expected, grab the current page of ids from the redux store
  //
  const count = AppConfiguration.pageLimit
  const [ vms, pools ] = yield all([
    call(vmsExpectMorePages ? fetchVms : currentVmsIds, { payload: { count, page: vmsPage + 1 } }),
    call(poolsExpectMorePages ? fetchPools : currentPoolsIds, { payload: { count, page: poolsPage + 1 } }),
  ])

  //
  // Since the REST API doesn't give a record count in paginated responses, we have
  // to guess if there is more to fetch.  Assume there is more to fetch if the page
  // of ids fetched/accessed is full.
  //
  yield put(updatePagingData({
    vmsPage: vmsExpectMorePages ? vmsPage + 1 : undefined,
    vmsExpectMorePages: vms.length >= count,
    poolsPage: poolsExpectMorePages ? poolsPage + 1 : undefined,
    poolsExpectMorePages: pools.length >= count,
  }))
}

export function* fetchVms ({ payload: { count, page, shallowFetch = true } }) {
  const fetchedVmIds = []

  const additional = shallowFetch ? VM_FETCH_ADDITIONAL_SHALLOW : VM_FETCH_ADDITIONAL_DEEP
  const apiVms = yield callExternalAction('getVms', Api.getVms, { payload: { count, page, additional } })
  if (apiVms && apiVms['vm']) {
    const internalVms = []
    for (const apiVm of apiVms.vm) {
      const internalVm = yield transformAndPermitVm(apiVm)
      fetchedVmIds.push(internalVm.id)
      internalVms.push(internalVm)
    }

    yield put(updateVms({ vms: internalVms, copySubResources: shallowFetch }))
    yield fetchUnknownIcons({ vms: internalVms })

    // NOTE: No need to fetch the current=true cdrom info at this point. The cdrom info
    //       is needed on the VM details page and `fetchSingleVm` is called upon entry
    //       to the details page. The `fetchSingleVm` fetch includes loading the
    //       appropriate cdrom info based on the VM's state. See `fetchSingleVm` for more
    //       details.
  }

  yield put(updateVmsPoolsCount())
  return fetchedVmIds
}

export function* fetchSingleVm (action) {
  const { vmId, shallowFetch } = action.payload

  action.payload.additional = shallowFetch ? VM_FETCH_ADDITIONAL_SHALLOW : VM_FETCH_ADDITIONAL_DEEP

  const vm = yield callExternalAction('getVm', Api.getVm, action, true)
  let internalVm = null
  if (vm && vm.id) {
    internalVm = yield transformAndPermitVm(vm)

    // If the VM is running, we want to display the current=true cdrom info. Due
    // to an API restriction, current=true cdrom info cannot currently (Aug-2018)
    // be accessed via the additional fetch list on the VM. Fetch it directly.
    if (!shallowFetch && internalVm.status === 'up') {
      internalVm.cdrom = yield fetchVmCdRom({ vmId: internalVm.id, current: true })
    }

    if (!shallowFetch) {
      internalVm.disks = (yield all(internalVm.disks.map(putPermissionsInDisk)))
    }

    // NOTE: Snapshot Disks and Nics are not currently (Sept-2018) available via
    //       additional/follow param on the VM/snapshot fetch.  We need to fetch them
    //       directly.
    for (const snapshot of internalVm.snapshots) {
      const follows = yield all([
        call(fetchVmSnapshotDisks, { vmId: internalVm.id, snapshotId: snapshot.id }),
        call(fetchVmSnapshotNics, { vmId: internalVm.id, snapshotId: snapshot.id }),
      ])
      snapshot.disks = follows[0]
      snapshot.nics = follows[1]
    }

    yield put(updateVms({ vms: [internalVm], copySubResources: shallowFetch }))
    yield fetchUnknownIcons({ vms: [internalVm] })
  } else {
    if (vm && vm.error && vm.error.status === 404) {
      yield put(removeVms({ vmIds: [vmId] }))
    }
  }

  yield put(updateVmsPoolsCount())
  return internalVm
}

export function* fetchPools (action) {
  const fetchedPoolIds = []

  const apiPools = yield callExternalAction('getPools', Api.getPools, action)
  if (apiPools && apiPools['vm_pool']) {
    const internalPools = apiPools.vm_pool.map(pool => Api.poolToInternal({ pool }))
    internalPools.forEach(pool => fetchedPoolIds.push(pool.id))

    yield put(updatePools({ pools: internalPools }))
    yield put(updateVmsPoolsCount())
  }

  return fetchedPoolIds
}

export function* fetchCurrentUser () {
  const userId = yield select((state) => state.config.getIn(['user', 'id']))
  const user = yield callExternalAction('user', Api.user, {
    payload: {
      userId,
    },
  })

  yield put(setUser({ user: Transforms.User.toInternal({ user }) }))
}

export function* fetchSinglePool (action) {
  const { poolId } = action.payload

  const pool = yield callExternalAction('getPool', Api.getPool, action, true)
  let internalPool = false
  if (pool && pool.id) {
    internalPool = Api.poolToInternal({ pool })
    yield put(updatePools({ pools: [internalPool] }))
  } else {
    if (pool && pool.error && pool.error.status === 404) {
      yield put(removePools({ poolIds: [poolId] }))
    }
  }

  yield put(updateVmsPoolsCount())
  return internalPool
}

/*
 * Fetch a VM's cdrom configuration based on the status of the VM. A running VM's cdrom
 * info comes from "current=true" while a non-running VM's cdrom info comes from the
 * next_run/"current=false" API parameter.
 */
function* fetchVmCdRom ({ vmId, current }) {
  const cdrom = yield callExternalAction('getCdRom', Api.getCdRom, getVmCdRom({ vmId, current }))

  let cdromInternal = null
  if (cdrom) {
    cdromInternal = Api.cdRomToInternal({ cdrom })
  }
  return cdromInternal
}

export function* fetchDisks ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const vmId = vm.id
    const disks = yield fetchVmDisks({ vmId })
    yield put(setVmDisks({ vmId, disks }))
  })
}

function* fetchVmDisks ({ vmId }) {
  // TODO: Enhance to use the `follow` API parameter (in API >=4.2) to reduce the request count
  //       This should follow the same style as `fetchSingleVm` and would require an extension to `Api.diskattachments`
  const diskattachments = yield callExternalAction('diskattachments', Api.diskattachments, { type: 'GET_DISK_ATTACHMENTS', payload: { vmId } })

  if (diskattachments && diskattachments['disk_attachment']) { // array
    const internalDisks = []
    yield * foreach(diskattachments['disk_attachment'], function* (attachment) {
      const diskId = attachment.disk.id
      const disk = yield callExternalAction('disk', Api.disk, { type: 'GET_DISK_DETAILS', payload: { diskId } })
      const internalDisk = yield putPermissionsInDisk(Api.diskToInternal({ disk, attachment }))
      internalDisks.push(internalDisk)
    })
    return internalDisks
  }
  return []
}

export function* addVmNic (action) {
  const nic = yield callExternalAction('addNicToVm', Api.addNicToVm, action)

  if (nic && nic.id) {
    const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
    yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
  }
}

function* deleteVmNic (action) {
  yield callExternalAction('deleteNicFromVm', Api.deleteNicFromVm, action)

  const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
  yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
}

function* editVmNic (action) {
  yield callExternalAction('editNicInVm', Api.editNicInVm, action)

  const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
  yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
}

function* getSingleInstance ({ vmId, poolId }) {
  const fetches = [ fetchSingleVm(getSingleVm({ vmId })) ]
  if (poolId) {
    fetches.push(fetchSinglePool(getSinglePool({ poolId })))
  }
  yield all(fetches)
}

export function* startProgress ({ vmId, poolId, name }) {
  if (vmId) {
    yield put(vmActionInProgress({ vmId, name, started: true }))
  } else {
    yield put(poolActionInProgress({ poolId, name, started: true }))
  }
}

export function* stopProgress ({ vmId, poolId, name, result }) {
  if (result && result.status === 'complete') {
    vmId = vmId || result.vm.id
    // do not call 'end of in progress' if successful,
    // since UI will be updated by refresh
    yield delay(5 * 1000)
    yield getSingleInstance({ vmId, poolId })

    yield delay(30 * 1000)
    yield getSingleInstance({ vmId, poolId })
  }

  const actionInProgress = vmId ? vmActionInProgress : poolActionInProgress
  yield put(actionInProgress(Object.assign(vmId ? { vmId } : { poolId }, { name, started: false })))
}

function* fetchAllEvents (action) {
  const user = yield select(state => ({
    id: state.config.getIn(['user', 'id']),
    name: `${state.config.getIn(['user', 'name'])}@${state.config.get('domain')}`,
  }))

  const events = yield callExternalAction('events', Api.events, { payload: {} })

  if (events.error) {
    return
  }

  const internalEvents = events.event
    ? events.event
      .filter((event) =>
        event.severity === 'error' &&
        event.user &&
        (event.user.id === user.id || event.user.name === user.name)
      )
      .map((event) => Api.eventToInternal({ event }))
    : []
  yield put(setUserMessages({ messages: internalEvents }))
}

function* dismissEvent (action) {
  const { event } = action.payload
  if (event.source === 'server') {
    const result = yield callExternalAction('dismissEvent', Api.dismissEvent, { payload: { eventId: event.id } })

    if (result.status === 'complete') {
      yield fetchAllEvents(action)
    }
  } else {
    yield put(dismissUserMessage({ eventId: event.id }))
  }
}

function* clearEvents (action) {
  const user = yield select(state => ({
    id: state.config.getIn(['user', 'id']),
    name: `${state.config.getIn(['user', 'name'])}@${state.config.get('domain')}`,
  }))
  const events = yield callExternalAction('events', Api.events, { payload: {} })

  if (events.error) {
    return
  }

  const sagaEvents = events.event
    ? events.event
      .filter((event) =>
        event.severity === 'error' &&
        event.user &&
        (event.user.id === user.id || event.user.name === user.name)
      ).map((event) => callExternalAction('dismissEvent', Api.dismissEvent, { payload: { eventId: event.id } }))
    : []

  yield all(sagaEvents)

  yield fetchAllEvents(action)
}

export function* fetchVmSessions ({ vmId }) {
  const sessions = yield callExternalAction('sessions', Api.sessions, { payload: { vmId } })

  if (sessions && sessions['session']) {
    return Api.sessionsToInternal({ sessions })
  }
  return []
}

export function* fetchVmPermissions ({ vmId }) {
  const permissions = yield callExternalAction('getVmPermissions', Api.getVmPermissions, { payload: { vmId } })

  if (permissions && permissions['permission']) {
    return Api.permissionsToInternal({ permissions: permissions.permission })
  }
  return []
}

/**
 * VmDetail is to be rendered.
 */
export function* selectVmDetail (action) {
  yield fetchSingleVm(getSingleVm({ vmId: action.payload.vmId })) // async data refresh
}

function* selectPoolDetail (action) {
  yield fetchSinglePool(getSinglePool({ poolId: action.payload.poolId }))
}

function* saveFilters (actions) {
  const { filters } = actions.payload
  const userId = yield select(state => state.config.getIn(['user', 'id']))
  saveToLocalStorage(`vmFilters-${userId}`, JSON.stringify(filters))
  yield put(setVmsFilters({ filters }))
}

function* fetchVmNics ({ vmId }) {
  const nics = yield callExternalAction('getVmNic', Api.getVmNic, { type: 'GET_VM_NICS', payload: { vmId } })
  if (nics && nics['nic']) {
    const nicsInternal = nics.nic.map(nic => Api.nicToInternal({ nic }))
    return nicsInternal
  }
  return []
}

export function* fetchVmSnapshots ({ vmId }) {
  const snapshots = yield callExternalAction('snapshots', Api.snapshots, { type: 'GET_VM_SNAPSHOT', payload: { vmId } })
  let snapshotsInternal = []

  if (snapshots && snapshots.snapshot) {
    snapshotsInternal = snapshots.snapshot.map(snapshot => Api.snapshotToInternal({ snapshot }))

    // NOTE: Snapshot Disks and Nics are not currently (Sept-2018) available via
    //       additional/follow param on the snapshot fetch.  We need to fetch them
    //       directly.
    for (const snapshot of snapshotsInternal) {
      const follows = yield all([
        call(fetchVmSnapshotDisks, { vmId, snapshotId: snapshot.id }),
        call(fetchVmSnapshotNics, { vmId, snapshotId: snapshot.id }),
      ])
      snapshot.disks = follows[0]
      snapshot.nics = follows[1]
    }
  }

  yield put(setVmSnapshots({ vmId, snapshots: snapshotsInternal }))
}

function* fetchVmSnapshotDisks ({ vmId, snapshotId }) {
  const disks = yield callExternalAction('snapshotDisks', Api.snapshotDisks, { payload: { vmId, snapshotId } }, true)
  let disksInternal = []
  if (disks && disks.disk) {
    disksInternal = disks.disk.map(disk => Api.diskToInternal({ disk }))
  }
  return disksInternal
}

function* fetchVmSnapshotNics ({ vmId, snapshotId }) {
  const nics = yield callExternalAction('snapshotNics', Api.snapshotNics, { payload: { vmId, snapshotId } }, true)
  let nicsInternal = []
  if (nics && nics.nic) {
    nicsInternal = nics.nic.map((nic) => Api.nicToInternal({ nic }))
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

    takeLatest(CHECK_TOKEN_EXPIRED, doCheckTokenExpired),
    takeEvery(DELAYED_REMOVE_ACTIVE_REQUEST, delayedRemoveActiveRequest),

    throttle(100, GET_BY_PAGE, fetchByPage),
    throttle(100, GET_VMS, fetchVms),
    throttle(100, GET_POOLS, fetchPools),
    takeLatest(GET_USER, fetchCurrentUser),

    takeLatest(GET_ALL_EVENTS, fetchAllEvents),
    takeEvery(DISMISS_EVENT, dismissEvent),
    takeEvery(CLEAR_USER_MSGS, clearEvents),

    takeLatest(NAVIGATE_TO_VM_DETAILS, navigateToVmDetails),
    takeEvery(SELECT_VM_DETAIL, selectVmDetail),
    takeEvery(SELECT_POOL_DETAIL, selectPoolDetail),

    takeEvery(ADD_VM_NIC, addVmNic),
    takeEvery(DELETE_VM_NIC, deleteVmNic),
    takeEvery(EDIT_VM_NIC, editVmNic),

    takeEvery(GET_CONSOLE_OPTIONS, getConsoleOptions),
    takeEvery(SAVE_CONSOLE_OPTIONS, saveConsoleOptions),
    takeEvery(OPEN_CONSOLE_MODAL, openConsoleModal),
    takeEvery(DOWNLOAD_CONSOLE_VM, downloadVmConsole),
    takeEvery(GET_RDP_VM, getRDPVm),

    takeEvery(SAVE_FILTERS, saveFilters),

    // Sagas from Components
    ...sagasDisks,
    ...sagasRoles,
    ...sagasStorageDomains,
    ...sagasOptions,
    ...sagasVmChanges,
    ...sagasVmSnapshots,
  ])
}
