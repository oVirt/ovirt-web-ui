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
  fetchByPage,
  fetchPools,
  fetchSinglePool,
  fetchSingleVm,
  fetchVms,
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
      : currentPage.type === undefined ? C.LIST_PAGE_TYPE
        : currentPage.type

  console.info('refreshData() 🡒', 'refreshType:', refreshType, 'currentPage:', currentPage, 'payload:', action.payload)
  if (refreshType) {
    yield pagesRefreshers[refreshType](Object.assign({ id: currentPage.id }, action.payload))
  }
  console.info('refreshData() 🡒 finished')
}

const pagesRefreshers = {
  [C.LIST_PAGE_TYPE]: refreshListPage,
  [C.DETAIL_PAGE_TYPE]: refreshDetailPage,
  [C.CREATE_PAGE_TYPE]: refreshCreatePage,
  [C.CONSOLE_PAGE_TYPE]: refreshConsolePage,
}

function* getIdsByType (type) {
  const ids = Array.from(yield select(state => state.vms.get(type).keys()))
  return ids
}

function* refreshListPage ({ shallowFetch, onNavigation, onSchedule }) {
  const [ vmsPage, poolsPage ] = yield select(st => [ st.vms.get('vmsPage'), st.vms.get('poolsPage') ])

  // Special case for the very first `refreshListPage` of the App .. use fetchByPage()!
  if (vmsPage === 0 && poolsPage === 0) {
    yield call(fetchByPage)
    return
  }

  const [ vmsCount, poolsCount ] = yield all([
    call(function* () {
      // refresh VMs and remove any that haven't been refreshed
      if (vmsPage > 0) {
        const fetchedVmIds = yield fetchVms(Actions.getVmsByCount({
          count: vmsPage * AppConfiguration.pageLimit,
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
      }

      return yield select(state => state.vms.get('vms').size)
    }),

    call(function* () {
      // refresh Pools and remove any that haven't been refreshed
      if (poolsPage > 0) {
        const fetchedPoolIds = yield fetchPools(Actions.getPoolsByCount({
          count: poolsPage * AppConfiguration.pageLimit,
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
      }

      return yield select(state => state.vms.get('pools').size)
    }),
  ])

  //
  // Since it is possible that VMs or Pools have been added since the last refresh,
  // and another page of data could be available, the *ExpectMorePages values need
  // to be updated.  Similar to `fetchByPage()`, assume there is more to fetch if the
  // size of VMs/Pools is full.
  //
  yield put(Actions.updatePagingData({
    vmsExpectMorePages: vmsCount >= vmsPage * AppConfiguration.pageLimit,
    poolsExpectMorePages: poolsCount >= poolsPage * AppConfiguration.pageLimit,
  }))

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

function* refreshCreatePage ({ id, onNavigation, onSchedule }) {
  if (id) {
    yield selectVmDetail(Actions.selectVmDetail({ vmId: id }))
  }

  // Load ISO images on manual refresh click only
  if (!onNavigation && !onSchedule) {
    yield fetchIsoFiles(Actions.getIsoFiles())
  }
}

function* refreshConsolePage ({ id, onNavigation, onSchedule }) {
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
    }))
  }
}

/**
 * When ovirt-web-ui is installed to ovirt-engine, a logout should push the user to the
 * base ovirt welcome page.  But when running in dev mode or via container, the logout
 * page is displayed.  In that case, we want to make sure the page is set to something
 * appropriate and that background refreshing is no longer done.
 */
function* logoutAndCancelScheduler () {
  yield put(Actions.setCurrentPage({ type: C.NO_REFRESH_TYPE }))
  yield put(Actions.stopSchedulerFixedDelay())
}

export default [
  takeEvery(C.START_SCHEDULER_FIXED_DELAY, startSchedulerWithFixedDelay),
  throttle(5000, C.REFRESH_DATA, refreshData),
  takeLatest(C.CHANGE_PAGE, changePage),
  takeEvery(C.LOGOUT, logoutAndCancelScheduler),
]
