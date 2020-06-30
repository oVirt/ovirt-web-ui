import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
  throttle,
} from 'redux-saga/effects'

import * as Actions from '_/actions'
import * as C from '_/constants'

import AppConfiguration from '_/config'
import { isNumber } from '_/utils'
import { delay } from './utils'

import {
  fetchPoolsByCount,
  fetchSinglePool,
  fetchSingleVm,
  fetchVmsByCount,
  selectVmDetail,
} from './index'
import { getConsoleOptions } from './console'
import { fetchIsoFiles } from './storageDomains'

/**
 * Change the background refresh type based on the page type, and force a refresh.
 *
 * This should be done at the time of navigation to the page, typically by the page router.
 */
function* changePage (action) {
  yield put(Actions.stopSchedulerFixedDelay())
  yield put(Actions.setCurrentPage(action.payload))
  yield put(Actions.refresh({
    onNavigation: true,
    shallowFetch: true,
    page: yield select(state => state.vms.get('page')),
  }))
  yield put(Actions.startSchedulerFixedDelay())
}

/**
 * Invoke the correct refresh function based on the app's current page type.
 */
function* refreshData (action) {
  const currentPage = yield select(state => state.config.get('currentPage'))
  const refreshType =
    currentPage.type === C.NO_REFRESH_TYPE ? null
      : currentPage.type === undefined ? C.MAIN_PAGE_TYPE
        : currentPage.type

  console.info('refreshData() 🡒 payload:', action.payload, 'currentPage:', currentPage, 'refreshType:', refreshType)

  // TODO: We could keep track of the last time the timed refresh starts vs the last
  // TODO: time a refresh for the same page type was run.  If it is closer than a
  // TODO: given interval, push the timed refresh back out (kinda like a debounce).
  // TODO: There is no need to refresh data that was loaded a few seconds ago and may
  // TODO: not even be full rendered yet.

  if (refreshType) {
    yield pagesRefreshers[refreshType](Object.assign({ id: currentPage.id }, action.payload))
  }
  console.info('refreshData() 🡒 finished')
}

const pagesRefreshers = {
  [C.MAIN_PAGE_TYPE]: refreshMainPage,
  [C.DETAIL_PAGE_TYPE]: refreshDetailPage,
  [C.DIALOG_PAGE_TYPE]: refreshDialogPage,
  [C.CONSOLE_PAGE_TYPE]: refreshConsolePage,
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
  const fetchedVmIds = yield fetchVmsByCount(Actions.getVmsByCount({
    count: page * AppConfiguration.pageLimit,
    shallowFetch,
  }))

  const vmsIds = yield getIdsByType('vms')
  const fetchedDirectlyVmIds =
    (yield all(
      vmsIds
        .filter(vmId => !fetchedVmIds.includes(vmId))
        .map(vmId => call(fetchSingleVm, Actions.getSingleVm({ vmId, shallowFetch })))
    ))
      .reduce((vmIds, vm) => { if (vm) vmIds.push(vm.id); return vmIds }, [])

  yield put(Actions.removeMissingVms({ vmIdsToPreserve: [ ...fetchedVmIds, ...fetchedDirectlyVmIds ] }))

  // refresh Pools and remove any that haven't been refreshed
  const fetchedPoolIds = yield fetchPoolsByCount(Actions.getPoolsByCount({
    count: page * AppConfiguration.pageLimit,
  }))
  const filteredPoolIds = yield getIdsByType('pools')
  const fetchedDirectlyPoolIds =
    (yield all(
      filteredPoolIds
        .filter(poolId => !fetchedPoolIds.includes(poolId))
        .map(poolId => call(fetchSinglePool, Actions.getSinglePool({ poolId })))
    ))
      .reduce((poolIds, pool) => { if (pool) poolIds.push(pool.id); return poolIds }, [])

  yield put(Actions.removeMissingPools({ poolIdsToPreserve: [ ...fetchedPoolIds, ...fetchedDirectlyPoolIds ] }))

  // update counts
  yield put(Actions.updateVmsPoolsCount())
}

function* refreshDetailPage ({ id, onNavigation, onSchedule }) {
  yield selectVmDetail(Actions.selectVmDetail({ vmId: id }))
  yield getConsoleOptions(Actions.getConsoleOptions({ vmId: id }))

  // Load ISO images on manual refresh click only
  if (!onNavigation && !onSchedule) {
    yield fetchIsoFiles(Actions.getIsoFiles())
  }
}

function* refreshDialogPage ({ id, onNavigation, onSchedule }) { // TODO: Rename to `refreshCreatePage`
  if (id) {
    yield selectVmDetail(Actions.selectVmDetail({ vmId: id }))
  }

  // Load ISO images on manual refresh click only
  if (!onNavigation && !onSchedule) {
    yield fetchIsoFiles(Actions.getIsoFiles())
  }
}

function* refreshConsolePage ({ id }) {
  if (id) {
    yield selectVmDetail(Actions.selectVmDetail({ vmId: id }))
  }
}

function* startSchedulerWithFixedDelay (action) {
  // if a scheduler is already running, stop it
  yield put(Actions.stopSchedulerFixedDelay())

  // run a new scheduler
  yield schedulerWithFixedDelay(action.payload.delayInSeconds)
}

let _SchedulerCount = 0

function* schedulerWithFixedDelay (delayInSeconds = AppConfiguration.schedulerFixedDelayInSeconds) {
  if (!isNumber(delayInSeconds) || delayInSeconds <= 0) {
    return
  }

  const myId = _SchedulerCount++
  console.log(`⏰ schedulerWithFixedDelay[${myId}] 🡒 starting fixed delay scheduler`)

  let enabled = true
  while (enabled) {
    console.log(`⏰ schedulerWithFixedDelay[${myId}] 🡒 stoppable delay for: ${delayInSeconds}`)
    const { stopped } = yield race({
      stopped: take(C.STOP_SCHEDULER_FIXED_DELAY), // TODO: stop the scheduler if an error page or logged out page is displayed
      fixedDelay: call(delay, (delayInSeconds * 1000)),
    })

    if (stopped) {
      enabled = false
      console.log(`⏰ schedulerWithFixedDelay[${myId}] 🡒 scheduler has been stopped`)
      continue
    }

    const isTokenExpired = yield select(state => state.config.get('isTokenExpired'))
    if (isTokenExpired) {
      enabled = false
      console.log(`⏰ schedulerWithFixedDelay[${myId}] 🡒 scheduler has been stopped due to SSO token expiration`)
      continue
    }

    const oVirtVersion = yield select(state => state.config.get('oVirtApiVersion'))
    if (!oVirtVersion.get('passed')) {
      console.log(`⏰ schedulerWithFixedDelay[${myId}] 🡒 event skipped since oVirt API version does not match`)
      continue
    }

    console.log(`⏰ schedulerWithFixedDelay[${myId}] 🡒 running after delay of: ${delayInSeconds}`)
    yield put(Actions.refresh({
      onSchedule: true,
      shallowFetch: true,
      page: yield select(state => state.vms.get('page')),
    }))
  }
}

export default [
  takeEvery(C.START_SCHEDULER_FIXED_DELAY, startSchedulerWithFixedDelay),
  throttle(5000, C.REFRESH_DATA, refreshData),
  takeLatest(C.CHANGE_PAGE, changePage),
]
