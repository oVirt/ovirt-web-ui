import {
  resumeNotifications,
  loadUserOptions,
} from './options'

import {
  actionChannel,
  all,
  call,
  put,
  race,
  select,
  spawn,
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

const BACKGROUND_REFRESH = 'BACKGROUND_REFRESH'

//
// ** User Action Sagas **
//
/**
 * Change the background refresh type based on the page type, and force a refresh.
 *
 * This should be done at the time of navigation to the page, typically by the page router.
 */
function* changePage ({ payload: { type, id } }) {
  yield put(Actions.setCurrentPage({ type, id }))
  yield put({ type: BACKGROUND_REFRESH, subType: 'changePage' })
}

function* refreshManually () {
  yield put({ type: BACKGROUND_REFRESH, subType: 'manual' })
}

/**
 * When ovirt-web-ui is installed to ovirt-engine, a logout should push the user to the
 * base ovirt welcome page.  But when running in dev mode or via container, the logout
 * page is displayed.  In that case, we want to make sure the page is set to something
 * appropriate and that background refreshing is no longer done.
 */
function* logoutAndCancelScheduler () {
  yield put(Actions.setCurrentPage({ type: C.NO_REFRESH_TYPE }))
  yield put({ type: BACKGROUND_REFRESH, subType: 'stop' })
  yield put(Actions.cancelDoNotDisturbTimer())
}

//
// ** Refresh Sagas **
//
/**
 * Invoke the correct refresh function based on the app's current page type.
 */
function* refreshDataForCurrentPage ({
  pageRouterRefresh,
  schedulerRefresh,
  manualRefresh,
}) {
  const currentPage = yield select(state => state.config.get('currentPage'))
  const pageRefreshFunction = pagesRefreshers[currentPage.type]

  console.log('🔄 refreshDataForCurrentPage() 🡒 start, currentPage:', currentPage, 'pageRefreshFunction?', !!pageRefreshFunction)
  if (pageRefreshFunction) {
    yield call(pageRefreshFunction, {
      id: currentPage.id,
      pageRouterRefresh,
      schedulerRefresh,
      manualRefresh,
    })
  }
  yield put(Actions.updateLastRefresh())
  console.log('🔄 refreshDataForCurrentPage() 🡒 finished')
}

const pagesRefreshers = {
  [C.NO_REFRESH_TYPE]: null,
  [C.LIST_PAGE_TYPE]: refreshListPage,
  [C.DETAIL_PAGE_TYPE]: refreshDetailPage,
  [C.CREATE_PAGE_TYPE]: refreshCreatePage,
  [C.CONSOLE_PAGE_TYPE]: refreshConsolePage,
  [C.SETTINGS_PAGE_TYPE]: loadUserOptions,
}

function* getIdsByType (type) {
  const ids = Array.from(yield select(state => state.vms.get(type).keys()))
  return ids
}

function* refreshListPage () {
  const [vmsPage, vmsExpectMorePages, poolsPage, poolsExpectMorePages] = yield select(st => [
    st.vms.get('vmsPage'), st.vms.get('vmsExpectMorePages'),
    st.vms.get('poolsPage'), st.vms.get('poolsExpectMorePages'),
  ])

  // list page initial state - fetch the first page
  if (vmsPage === 0 && vmsExpectMorePages && poolsPage === 0 && poolsExpectMorePages) {
    yield fetchByPage()
    return
  }

  const [vmsCount, poolsCount] = yield all([
    call(function* () {
      // refresh VMs and remove any that haven't been refreshed
      if (vmsPage > 0) {
        const fetchedVmIds = yield fetchVms(Actions.getVmsByCount({
          count: vmsPage * AppConfiguration.pageLimit,
        }))

        const vmsIds = yield getIdsByType('vms')
        const fetchedDirectlyVmIds =
          (yield all(
            vmsIds
              .filter(vmId => !fetchedVmIds.includes(vmId))
              .map(vmId => call(fetchSingleVm, Actions.getSingleVm({ vmId, shallowFetch: true })))
          ))
            .reduce((vmIds, vm) => { if (vm) vmIds.push(vm.id); return vmIds }, [])

        yield put(Actions.removeMissingVms({ vmIdsToPreserve: [...fetchedVmIds, ...fetchedDirectlyVmIds] }))
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

        yield put(Actions.removeMissingPools({ poolIdsToPreserve: [...fetchedPoolIds, ...fetchedDirectlyPoolIds] }))
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

function* refreshDetailPage ({ id, manualRefresh }) {
  yield selectVmDetail(Actions.selectVmDetail({ vmId: id }))
  yield getConsoleOptions(Actions.getConsoleOptions({ vmId: id }))

  // Load ISO images on manual refresh click only
  if (manualRefresh) {
    yield fetchIsoFiles()
  }
}

function* refreshCreatePage ({ id, manualRefresh }) {
  if (id) {
    yield selectVmDetail(Actions.selectVmDetail({ vmId: id }))
  }

  // Load ISO images on manual refresh click only
  if (manualRefresh) {
    yield fetchIsoFiles()
  }
}

function* refreshConsolePage ({ id }) {
  if (id) {
    yield selectVmDetail(Actions.selectVmDetail({ vmId: id }))
  }
}

//
// *** Scheduler/Timer Sagas ***
//
/**
 * Starts a timer that can be cancelled by dispatching the given action.
 *
 * @param {number} timeInSeconds Timer duration
 * @param {string} cancelActionType Action type that will cancel this timer
 */
function* runCancellableTimer (timeInSeconds, cancelActionType) {
  if (!timeInSeconds) {
    return {}
  }

  const { cancelAction, fixedDelay } = yield race({
    cancelAction: take(cancelActionType),
    fixedDelay: delay(timeInSeconds * 1000),
  })

  return {
    stopped: !!cancelAction,
    timerCompleted: !!fixedDelay,
  }
}

/**
 * Continue previous wait period (unless immediate refresh is forced).
 * Restarting the wait period could lead to irregular, long intervals without refresh
 * or prevent the refresh (as long as user will keep changing the interval)
 *
 * Example:
 *   1. previous refresh period is 2 min (1m 30sec already elapsed)
 *   2. user changes it to 5min
 *   3. already elapsed time will be taken into consideration and refresh will be
 *      triggered after 3 m 30sec.
 *
 * Result: Wait intervals will be 2min -> 2min -> 5min -> 5min.
 * With restarting timers: 2min -> 2min -> 6min 30 sec -> 5min.
 */
function* calculateStartDelayFromLastRefresh () {
  const [
    delayInSeconds,
    lastRefresh,
  ] = yield select(state => ([
    state.options.getIn(['remoteOptions', 'refreshInterval', 'content'], AppConfiguration.schedulerFixedDelayInSeconds),
    state.config.get('lastRefresh', 0),
  ]))

  const timeFromLastRefresh = ((Date.now() - lastRefresh) / 1000).toFixed(0)
  return timeFromLastRefresh > delayInSeconds ? 0 : delayInSeconds - timeFromLastRefresh
}

//
// Background refresh timer
//
let _BackgroundRefreshTimerCount = 0

/**
 * Start a cancelable timer that will fire a background-refresh 'timer' action when the
 * timer completes successfully.
 *
 * @param {number} timerDuration Time to wait, in seconds, before firing the 'timer' action
 */
function* backgroundRefreshTimer (timerDuration = AppConfiguration.schedulerFixedDelayInSeconds) {
  if (!isNumber(timerDuration) || timerDuration <= 0) {
    console.error(`⏰ backgroundRefreshTimer 🡒 invalid arguments: timerDuration=${timerDuration}`)
    return
  }

  const myId = ++_BackgroundRefreshTimerCount
  console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 starting a timer with duration ${timerDuration}`)

  const { stopped: cancelled } = yield call(
    runCancellableTimer,
    timerDuration,
    C.CANCEL_REFRESH_TIMER
  )
  if (cancelled) {
    console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 timer has been cancelled`)
    return
  }

  if (myId !== _BackgroundRefreshTimerCount) {
    console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 timer has been cancelled, newer timer detected [${_BackgroundRefreshTimerCount}]`)
    return
  }

  const isTokenExpired = yield select(state => state.config.get('isTokenExpired'))
  if (isTokenExpired) {
    console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 timer has been cancelled, SSO token expired`)
    return
  }

  const oVirtVersionOk = yield select(state => state.config.getIn(['oVirtApiVersion', 'passed'], false))
  if (!oVirtVersionOk) {
    console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 timer event skipped, oVirt API is not ok`)
    return
  }

  console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 timer event!, duration: ${timerDuration}`)
  yield put({ type: BACKGROUND_REFRESH, subType: 'timer' })
}

//
// Do Not Disturb timer
//
let _DoNotDisturbTimerCount = 0
function* startDoNotDisturbTimer ({ payload: { delayInSeconds } }) {
  yield put(Actions.cancelDoNotDisturbTimer())

  const myId = _DoNotDisturbTimerCount++
  console.log(`notification timer [${myId}] - delay [${delayInSeconds}] sec`)
  const { stopped } = yield call(runCancellableTimer, delayInSeconds, C.CANCEL_DO_NOT_DISTURB_TIMER)
  if (stopped) {
    console.log(`notification timer [${myId}] - stopped`)
  } else {
    console.log(`notification timer [${myId}] - resume notifications`)
    yield call(resumeNotifications)
  }
}

//
// ** BACKGROUND_REFRESH channel handler **
//
function* handleBackgroundChannel (action) {
  const { subType } = action

  yield put(Actions.cancelRefreshTimer())

  let startNewTimer = true
  let timerDuration =
    yield select(({ options }) => options.getIn(['remoteOptions', 'refreshInterval', 'content'], AppConfiguration.schedulerFixedDelayInSeconds))

  switch (subType) {
    case 'changePage':
      yield refreshDataForCurrentPage({ pageRouterRefresh: true })
      break

    case 'manual':
      yield refreshDataForCurrentPage({ manualRefresh: true })
      break

    case 'timer':
      yield refreshDataForCurrentPage({ schedulerRefresh: true })
      break

    case 'fetchNextPageOfVmsAndPools':
      yield fetchByPage()
      break

    case 'restartBackgroundRefreshTimer':
      timerDuration = yield calculateStartDelayFromLastRefresh()
      break

    case 'stop':
      startNewTimer = false
      break
  }

  if (startNewTimer) {
    yield spawn(backgroundRefreshTimer, timerDuration)
  }
}

function* takeAndCallOnTheChannel (actionChannel) {
  console.log('BACKGROUND_REFRESH channel is open')

  try {
    while (true) {
      const action = yield take(actionChannel)
      yield call(handleBackgroundChannel, action)
    }
  } finally {
    console.log('BACKGROUND_REFRESH channel is closed')
  }
}

//
// Export an initialization saga that yields an array of effects to be run by the root saga
//
export default function* () {
  const backgroundChannel = yield actionChannel(BACKGROUND_REFRESH)

  return [
    call(takeAndCallOnTheChannel, backgroundChannel),

    // only process the 1st manual refresh received in a 5 second window
    throttle(5000, C.MANUAL_REFRESH, refreshManually),

    /*
    * Note: If a user goes crazy swapping between pages very quickly, a lot of `CHANGE_PAGE`
    *       actions will be fired.  Since changePage() will refresh the new page's data
    *       each time, it is possible to get to a point where multiple page refresh sagas
    *       are queued.  That can cause problems and slow down the app.  Not much to be
    *       done to prevent this from happening without slowing down the responsiveness
    *       of the app (by using a debounce or similar).
    */
    takeLatest(C.CHANGE_PAGE, changePage),

    throttle(100, C.GET_BY_PAGE, function* () {
      yield put({ type: BACKGROUND_REFRESH, subType: 'fetchNextPageOfVmsAndPools' })
    }),

    takeEvery(C.START_REFRESH_TIMER, function* () {
      yield put({ type: BACKGROUND_REFRESH, subType: 'restartBackgroundRefreshTimer' })
    }),

    takeEvery(C.START_DO_NOT_DISTURB_TIMER, startDoNotDisturbTimer),
    takeEvery(C.LOGOUT, logoutAndCancelScheduler),
  ]
}
