import {
  all,
  call,
  put,
  race,
  take,
  takeEvery,
  takeLatest,
  throttle,
  select,
} from 'redux-saga/effects'
import { push } from 'connected-react-router'

import Api, { Transforms } from '_/ovirtapi'
import AppConfiguration from '_/config'
import { saveToLocalStorage } from '_/storage'

import sagasDisks from './disks'
import sagasLogin from './login'
import sagasOptionsDialog from '_/components/OptionsDialog/sagas'
import sagasRoles from './roles'
import sagasStorageDomains, { fetchIsoFiles } from './storageDomains'
import sagasVmChanges from './vmChanges'
import sagasVmSnapshots from '_/components/VmDetails/cards/SnapshotsCard/sagas'

import {
  setChanged,
  setVmDisks,
  updateVms,
  removeVms,
  vmActionInProgress,
  removeMissingVms,

  getSingleVm,
  selectVmDetail as actionSelectVmDetail,
  setVmSnapshots,

  setUserMessages,
  dismissUserMessage,

  getSinglePool,
  removeMissingPools,
  removePools,
  updatePools,
  updateVmsPoolsCount,
  poolActionInProgress,

  refresh,
  getVmsByCount,
  getPoolsByCount,
  getIsoFiles,
  getConsoleOptions as actionGetConsoleOptions,
  setVmNics,
  removeActiveRequest,
  stopSchedulerFixedDelay,
  getVmCdRom,
  setCurrentPage,
  setVmsFilters,
} from '_/actions'

import {
  callExternalAction,
  delay,
  doCheckTokenExpired,
  entityPermissionsToUserPermits,
  foreach,
  fetchPermits,
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
  CHANGE_PAGE,
  OPEN_CONSOLE_MODAL,
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
  GET_POOLS_BY_COUNT,
  GET_POOLS_BY_PAGE,
  GET_RDP_VM,
  GET_VMS_BY_COUNT,
  GET_VMS_BY_PAGE,
  REFRESH_DATA,
  SAVE_CONSOLE_OPTIONS,
  SAVE_FILTERS,
  SELECT_POOL_DETAIL,
  SELECT_VM_DETAIL,
  NAVIGATE_TO_VM_DETAILS,
  START_SCHEDULER_FIXED_DELAY,
  STOP_SCHEDULER_FIXED_DELAY,

  CONSOLE_PAGE_TYPE,
  DETAIL_PAGE_TYPE,
  DIALOG_PAGE_TYPE,
  MAIN_PAGE_TYPE,
  NO_REFRESH_TYPE,
} from '_/constants'

import {
  canUserChangeCd,
  canUserEditDisk,
  canUserEditVm,
  canUserEditVmStorage,
  canUserManipulateSnapshots,
  isNumber,
} from '_/utils'

const vmFetchAdditionalList =
  [
    'cdroms',
    'sessions',
    'disk_attachments.disk',
    'graphics_consoles',
    'nics',
    'snapshots',
    'statistics',
    'permissions',
  ]

export const EVERYONE_GROUP_ID = 'eee00000-0000-0000-0000-123456789eee'

function* fetchByPage (action) {
  yield put(setChanged({ value: false }))
  yield fetchVmsByPage(action)
  yield fetchPoolsByPage(action)
}

function* getIdsByType (type) {
  const ids = yield select(state =>
    state.vms
      .get(type)
      .reduce((entityIds, entity, entityId) => {
        entityIds.push(entityId)
        return entityIds
      }, [])
  )
  return ids
}

function* refreshMainPage ({ shallowFetch, page }) {
  shallowFetch = !!shallowFetch

  // refresh VMs and remove any that haven't been refreshed
  const fetchedVmIds = yield fetchVmsByCount(getVmsByCount({
    count: page * AppConfiguration.pageLimit,
    shallowFetch,
  }))

  const vmsIds = yield getIdsByType('vms')
  const fetchedDirectlyVmIds =
    (yield all(
      vmsIds
        .filter(vmId => !fetchedVmIds.includes(vmId))
        .map(vmId => call(fetchSingleVm, getSingleVm({ vmId, shallowFetch })))
    ))
      .reduce((vmIds, vm) => { if (vm) vmIds.push(vm.id); return vmIds }, [])

  yield put(removeMissingVms({ vmIdsToPreserve: [ ...fetchedVmIds, ...fetchedDirectlyVmIds ] }))

  // refresh Pools and remove any that haven't been refreshed
  const fetchedPoolIds = yield fetchPoolsByCount(getPoolsByCount({
    count: page * AppConfiguration.pageLimit,
  }))
  const filteredPoolIds = yield getIdsByType('pools')
  const fetchedDirectlyPoolIds =
    (yield all(
      filteredPoolIds
        .filter(poolId => !fetchedPoolIds.includes(poolId))
        .map(poolId => call(fetchSinglePool, getSinglePool({ poolId })))
    ))
      .reduce((poolIds, pool) => { if (pool) poolIds.push(pool.id); return poolIds }, [])

  yield put(removeMissingPools({ poolIdsToPreserve: [ ...fetchedPoolIds, ...fetchedDirectlyPoolIds ] }))

  // update counts
  yield put(updateVmsPoolsCount())
}

function* refreshDetailPage ({ id, onNavigation, onSchedule }) {
  yield selectVmDetail(actionSelectVmDetail({ vmId: id }))
  yield getConsoleOptions(actionGetConsoleOptions({ vmId: id }))

  // Load ISO images on manual refresh click only
  if (!onNavigation && !onSchedule) {
    yield fetchIsoFiles(getIsoFiles())
  }
}

function* refreshDialogPage ({ id, onNavigation, onSchedule }) {
  if (id) {
    yield selectVmDetail(actionSelectVmDetail({ vmId: id }))
  }

  // Load ISO images on manual refresh click only
  if (!onNavigation && !onSchedule) {
    yield fetchIsoFiles(getIsoFiles())
  }
}

function* refreshConsolePage ({ id }) {
  if (id) {
    yield selectVmDetail(actionSelectVmDetail({ vmId: id }))
  }
}

const pagesRefreshers = {
  [MAIN_PAGE_TYPE]: refreshMainPage,
  [DETAIL_PAGE_TYPE]: refreshDetailPage,
  [DIALOG_PAGE_TYPE]: refreshDialogPage,
  [CONSOLE_PAGE_TYPE]: refreshConsolePage,
}

function* refreshData (action) {
  const currentPage = yield select(state => state.config.get('currentPage'))
  const refreshType =
    currentPage.type === NO_REFRESH_TYPE ? null
      : currentPage.type === undefined ? MAIN_PAGE_TYPE
        : currentPage.type

  console.info('refreshData() 🡒 payload:', action.payload, 'currentPage:', currentPage, 'refreshType:', refreshType)
  if (refreshType) {
    yield pagesRefreshers[refreshType](Object.assign({ id: currentPage.id }, action.payload))
  }
  console.info('refreshData() 🡒 finished')
}

/**
 * Change the current page type (based on `routes.js`) at the time of navigation to the page.
 */
function* changePage (action) {
  yield put(setCurrentPage(action.payload))
  yield refreshData(refresh({
    onNavigation: true,
    shallowFetch: true,
    page: yield select(state => state.vms.get('page')),
  }))
}

export function* transformAndPermitVm (vm) {
  const internalVm = Transforms.VM.toInternal({ vm })
  internalVm.userPermits = yield entityPermissionsToUserPermits(internalVm)

  internalVm.canUserChangeCd = canUserChangeCd(internalVm.userPermits)
  internalVm.canUserEditVm = canUserEditVm(internalVm.userPermits)
  internalVm.canUserManipulateSnapshots = canUserManipulateSnapshots(internalVm.userPermits)
  internalVm.canUserEditVmStorage = canUserEditVmStorage(internalVm.userPermits)

  return internalVm
}

/**
 * Fetch VMs with additional nested data requested
 */
function* fetchVmsByPage (action) {
  const { shallowFetch, page } = action.payload

  action.payload.additional = shallowFetch ? ['graphics_consoles'] : vmFetchAdditionalList

  const vmsOnPage = yield callExternalAction('getVmsByPage', Api.getVmsByPage, action)
  if (vmsOnPage && vmsOnPage['vm']) {
    const internalVms = yield all(vmsOnPage.vm.map(transformAndPermitVm))
    yield put(updateVms({ vms: internalVms, copySubResources: shallowFetch, page }))
    yield fetchUnknownIcons({ vms: internalVms })

    // NOTE: No need to fetch the current=true cdrom info at this point. The cdrom info
    //       is needed on the VM details page and `fetchSingleVm` is called upon entry
    //       to the details page. The `fetchSingleVm` fetch includes loading the
    //       appropriate cdrom info based on the VM's state. See `fetchSingleVm` for more
    //       details.
  }

  yield put(updateVmsPoolsCount())
}

/**
 * Fetch a given number of VMs (**action.payload.count**).
 */
function* fetchVmsByCount (action) {
  const { shallowFetch } = action.payload
  const fetchedVmIds = []

  action.payload.additional = shallowFetch ? [ 'graphics_consoles' ] : vmFetchAdditionalList

  const allVms = yield callExternalAction('getVmsByCount', Api.getVmsByCount, action)
  if (allVms && allVms['vm']) {
    const internalVms = []
    for (const vm of allVms.vm) {
      const internalVm = yield transformAndPermitVm(vm)
      fetchedVmIds.push(internalVm.id)
      internalVms.push(internalVm)
    }
    console.log('internalVms:', internalVms)

    yield put(updateVms({ vms: internalVms, copySubResources: shallowFetch }))
    yield fetchUnknownIcons({ vms: internalVms })

    // NOTE: No need to fetch the current=true cdrom info at this point. See `fetchVmsByPage`
    //       or `fetchSingleVm` for more details.
  }

  yield put(updateVmsPoolsCount())
  return fetchedVmIds
}

function* putPermissionsInDisk (disk) {
  disk.permits = yield fetchPermits({ entityType: PermissionsType.DISK_TYPE, id: disk.id })
  disk.canUserEditDisk = canUserEditDisk(disk.permits)
  return disk
}

export function* fetchSingleVm (action) {
  const { vmId, shallowFetch } = action.payload

  action.payload.additional = shallowFetch ? [ 'graphics_consoles' ] : vmFetchAdditionalList

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

function* fetchPoolsByCount (action) {
  const fetchedPoolIds = []

  const allPools = yield callExternalAction('getPoolsByCount', Api.getPoolsByCount, action)
  if (allPools && allPools['vm_pool']) {
    const internalPools = allPools.vm_pool.map(pool => Api.poolToInternal({ pool }))
    internalPools.forEach(pool => fetchedPoolIds.push(pool.id))

    yield put(updatePools({ pools: internalPools }))
    yield put(updateVmsPoolsCount())
  }

  return fetchedPoolIds
}

function* fetchPoolsByPage (action) {
  const allPools = yield callExternalAction('getPoolsByPage', Api.getPoolsByPage, action)

  if (allPools && allPools['vm_pool']) {
    const internalPools = allPools.vm_pool.map(pool => Api.poolToInternal({ pool }))

    yield put(updatePools({ pools: internalPools }))
    yield put(updateVmsPoolsCount())
  }
}

function* fetchSinglePool (action) {
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
  const actionInProgress = vmId ? vmActionInProgress : poolActionInProgress
  if (result && result.status === 'complete') {
    vmId = vmId || result.vm.id
    // do not call 'end of in progress' if successful,
    // since UI will be updated by refresh
    yield delay(5 * 1000)
    yield getSingleInstance({ vmId, poolId })

    yield delay(30 * 1000)
    yield getSingleInstance({ vmId, poolId })
  }

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
  const nics = yield callExternalAction('getVmsNic', Api.getVmsNic, { type: 'GET_VM_NICS', payload: { vmId } })

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

function* startSchedulerWithFixedDelay (action) {
  // if a scheduler is already running, stop it
  yield put(stopSchedulerFixedDelay())

  // run a new scheduler
  yield schedulerWithFixedDelay(action.payload.delayInSeconds)
}

let _SchedulerCount = 0

function* schedulerWithFixedDelay (delayInSeconds = AppConfiguration.schedulerFixedDelayInSeconds) {
  if (!isNumber(delayInSeconds) || delayInSeconds <= 0) {
    return
  }

  const myId = _SchedulerCount++
  console.log(`⏰ schedulerWithFixedDelay[${myId}] starting fixed delay scheduler`)

  let enabled = true
  while (enabled) {
    console.log(`⏰ schedulerWithFixedDelay[${myId}] stoppable delay for: ${delayInSeconds}`)
    const { stopped } = yield race({
      stopped: take(STOP_SCHEDULER_FIXED_DELAY),
      fixedDelay: call(delay, (delayInSeconds * 1000)),
    })

    const isTokenExpired = yield select(state => state.config.get('isTokenExpired'))
    if (isTokenExpired) {
      enabled = false
      console.log(`⏰ schedulerWithFixedDelay[${myId}] scheduler has been stopped due token expiration`)
      continue
    }

    if (stopped) {
      enabled = false
      console.log(`⏰ schedulerWithFixedDelay[${myId}] scheduler has been stopped`)
    } else {
      console.log(`⏰ schedulerWithFixedDelay[${myId}] running after delay of: ${delayInSeconds}`)

      const oVirtVersion = yield select(state => state.config.get('oVirtApiVersion'))
      if (oVirtVersion.get('passed')) {
        yield refreshData(refresh({
          onSchedule: true,
          shallowFetch: true,
          page: yield select(state => state.vms.get('page')),
        }))
      } else {
        console.log(`⏰ schedulerWithFixedDelay[${myId}] event skipped since oVirt API version does not match`)
      }
    }
  }
}

function* navigateToVmDetails ({ payload: { vmId } }) {
  yield put(push(`/vm/${vmId}`))
}

export function* rootSaga () {
  yield all([
    ...sagasLogin,
    takeLatest(CHECK_TOKEN_EXPIRED, doCheckTokenExpired),
    takeEvery(DELAYED_REMOVE_ACTIVE_REQUEST, delayedRemoveActiveRequest),

    takeEvery(START_SCHEDULER_FIXED_DELAY, startSchedulerWithFixedDelay),
    // STOP_SCHEDULER_FIXED_DELAY is taken by `schedulerWithFixedDelay()`
    throttle(1000, REFRESH_DATA, refreshData),
    takeLatest(CHANGE_PAGE, changePage),

    throttle(100, GET_BY_PAGE, fetchByPage),
    throttle(100, GET_VMS_BY_COUNT, fetchVmsByCount),
    throttle(100, GET_VMS_BY_PAGE, fetchVmsByPage),
    throttle(100, GET_POOLS_BY_COUNT, fetchPoolsByCount),
    throttle(100, GET_POOLS_BY_PAGE, fetchPoolsByPage),

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
    ...sagasOptionsDialog,
    ...sagasRoles,
    ...sagasStorageDomains,
    ...sagasVmChanges,
    ...sagasVmSnapshots,
  ])
}
