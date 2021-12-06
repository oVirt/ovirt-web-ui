import {
  resumeNotifications,
  loadUserOptions,
} from './options'

import {
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
  fetchAndPutSingleVm,
  fetchByPage,
  fetchPools,
  fetchSinglePool,
  fetchSingleVm,
  fetchVms,
} from './index'
import { getConsoleOptions } from './console'
import { fetchIsoFiles } from './storageDomains'
import { fetchUnknownIcons } from './osIcons'

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
  const targetPage = { type, id }
  yield put(Actions.setCurrentPage(targetPage))
  yield put(backgroundRefreshAction('changePage', targetPage))
}

/**
 * Refresh the current page NOW.
 */
function* refreshManually () {
  const targetPage = yield select(({ config }) => config.get('currentPage'))
  yield put(backgroundRefreshAction('manual', targetPage))
}

/**
 * Start or restart the background refresh timer, picking up the current refresh
 * interval from the store.
 */
function* restartBackgroundRefreshTimer () {
  yield put(backgroundRefreshAction('restartBackgroundRefreshTimer'))
}

/**
 * When ovirt-web-ui is installed to ovirt-engine, a logout should push the user to the
 * base ovirt welcome page.  But when running in dev mode or via container, the logout
 * page is displayed.  In that case, we want to make sure the page is set to something
 * appropriate and that background refreshing is no longer done.
 */
function* logoutAndCancelScheduler () {
  yield put(Actions.setCurrentPage({ type: C.NO_REFRESH_TYPE }))
  yield put(backgroundRefreshAction('stop'))
  yield put(Actions.cancelResumeNotificationsTimer())
}

//
// ** Refresh Sagas **
//
/**
 * Invoke the correct refresh function based on the provided page.
 */
function* refreshDataForTargetPage ({
  pageRouterRefresh = false,
  schedulerRefresh = false,
  manualRefresh = false,
  targetPage,
}) {
  const pageRefreshFunction = pagesRefreshers[targetPage.type]

  console.log('🔄 refreshDataForCurrentPage() 🡒 start, targetPage:', targetPage, 'pageRefreshFunction?', !!pageRefreshFunction)
  if (pageRefreshFunction) {
    yield call(pageRefreshFunction, {
      id: targetPage.id,
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

function* refreshListPage () {
  const {
    vmsPage,
    vmsExpectMorePages,
    existingVmIds,
    poolsPage,
    poolsExpectMorePages,
    existingPoolIds,
  } = yield select(({ vms }) => ({
    vmsPage: vms.get('vmsPage'),
    vmsExpectMorePages: !!vms.get('vmsExpectMorePages'),
    existingVmIds: Array.from(vms.get('vms').keys()),
    poolsPage: vms.get('poolsPage'),
    poolsExpectMorePages: !!vms.get('poolsExpectMorePages'),
    existingPoolIds: Array.from(vms.get('pools').keys()),
  }))

  // list page initial state - fetch the first page
  if (vmsPage === 0 && vmsExpectMorePages && poolsPage === 0 && poolsExpectMorePages) {
    yield fetchByPage()
    return
  }

  const filterAndFetchMissing = function* ({ expected, existingIds, fetchForId, mapResult, mapId }) {
    // if any existing VMs/pools are not in expectedVms, fetch them individually
    // however if main query failed (expectedVms == null) then it makes no sense
    // to fetch vms one-by-one
    const expectedIds = new Set(expected ? expected.map(({ id }) => id) : [])
    const unexpected = expected
      ? yield all(
        existingIds
          .filter(id => !expectedIds.has(id))
          .map(fetchForId)
      )
      : []

    return {
      refreshed: [
        ...(expected || []),
        ...unexpected.filter(result => !result.error).map(mapResult),
      ],
      // remove VM/pool only if the server reported 404 otherwise a temporary network error
      // causes VM/pool to disappear from the dashboard
      missedIds: unexpected.filter(({ error, poolId, vmId }) => error?.status === 404).map(mapId),
    }
  }

  const [vmsResults, poolsResults] = yield all([
    call(function* () {
      // fetch the VMs we are expecting to be in the pages we have fetched
      const { internalVms: expectedVms } = yield fetchVms(Actions.getVmsByCount({
        count: vmsPage * AppConfiguration.pageLimit,
      }))

      return yield filterAndFetchMissing({
        expected: expectedVms,
        existingIds: existingVmIds,
        fetchForId: vmId => call(fetchSingleVm, Actions.getSingleVm({ vmId, shallowFetch: true })),
        mapResult: result => result.internalVm,
        mapId: result => result.vmId,
      })
    }),

    call(function* () {
      // fetch the Pools we are expecting to be in the pages we have fetched
      const { internalPools: expectedPools } = yield fetchPools(Actions.getPoolsByCount({
        count: poolsPage * AppConfiguration.pageLimit,
      }))

      return yield filterAndFetchMissing({
        expected: expectedPools,
        existingIds: existingPoolIds,
        fetchForId: poolId => call(fetchSinglePool, Actions.getSinglePool({ poolId })),
        mapResult: result => result.internalPool,
        mapId: result => result.poolId,
      })
    }),
  ])

  // Put the refreshed VMs and pools to the store
  yield put(Actions.updateVms({
    keepSubResources: true,
    vms: vmsResults.refreshed,
    removeVmIds: vmsResults.missedIds,

    pools: poolsResults.refreshed,
    removePoolIds: poolsResults.missedIds,
  }))
  yield fetchUnknownIcons({ vms: vmsResults.refreshed })
}

function* refreshDetailPage ({ id: vmId, manualRefresh }) {
  yield fetchAndPutSingleVm(Actions.getSingleVm({ vmId }))
  yield getConsoleOptions(Actions.getConsoleOptions({ vmId }))

  // TODO: If the VM is from a Pool, refresh the Pool as well.

  // Load ISO images on manual refresh click only
  if (manualRefresh) {
    yield fetchIsoFiles()
  }
}

function* refreshCreatePage ({ id: vmId, manualRefresh }) {
  if (vmId) {
    yield fetchAndPutSingleVm(Actions.getSingleVm({ vmId }))
  }

  // Load ISO images on manual refresh click only
  if (manualRefresh) {
    yield fetchIsoFiles()
  }
}

function* refreshConsolePage ({ id: vmId }) {
  if (vmId) {
    yield fetchAndPutSingleVm(Actions.getSingleVm({ vmId }))
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
    console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 timer has been cancelled, oVirt API is not ok`)
    return
  }

  console.log(`⏰ backgroundRefreshTimer[${myId}] 🡒 timer event!, duration: ${timerDuration}`)
  yield put(backgroundRefreshAction('timer'))
}

//
// Resume notifications timer (the do not disturb interval ends with a resume notifications action)
//
let _ResumeNotificationTimerCount = 0
function* startResumeNotificationsTimer ({ payload: { delayInSeconds } }) {
  yield put(Actions.cancelResumeNotificationsTimer())

  const myId = _ResumeNotificationTimerCount++
  console.log(`notification timer [${myId}] - delay [${delayInSeconds}] sec`)
  const { stopped } = yield call(runCancellableTimer, delayInSeconds, C.CANCEL_RESUME_NOTIFICATIONS_TIMER)
  if (stopped) {
    console.log(`notification timer [${myId}] - stopped`)
  } else {
    console.log(`notification timer [${myId}] - resume notifications`)
    yield call(resumeNotifications)
  }
}

//
// ** BACKGROUND_REFRESH handling **
//
function backgroundRefreshAction (subType, targetPage) {
  return {
    type: BACKGROUND_REFRESH,
    subType,
    targetPage,
  }
}

function* handleBackgroundChannel (action) {
  const { subType, targetPage } = action

  yield put(Actions.cancelRefreshTimer())

  let startNewTimer = true
  let timerDuration =
    yield select(({ options }) => options.getIn(['remoteOptions', 'refreshInterval', 'content'], AppConfiguration.schedulerFixedDelayInSeconds))

  switch (subType) {
    case 'changePage':
      yield refreshDataForTargetPage({ pageRouterRefresh: true, targetPage })
      break

    case 'manual':
      yield refreshDataForTargetPage({ manualRefresh: true, targetPage })
      break

    case 'timer':
      yield refreshDataForTargetPage({
        schedulerRefresh: true,
        targetPage: yield select(({ config }) => config.get('currentPage')),
      })
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

//
//
export default [
  takeEvery(BACKGROUND_REFRESH, handleBackgroundChannel),

  // only process the 1st manual refresh received in a 5 second window
  throttle(5000, C.MANUAL_REFRESH, refreshManually),

  /*
  * Note: If a user goes crazy swapping between pages very quickly, a lot of `CHANGE_PAGE`
  *       actions will be fired.  The `takeLatest()` effect used here will cancel[1] the
  *       currently running `changePage()` saga and start the new one.
  *
  *       There are two important things to think about with task cancellation.  First,
  *       our external call handler does not detect task cancellation and abort the API
  *       call.  The transport call will always complete.  Second, the cancellation
  *       propagates down, so the safest thing to do is to do a single `put()` action at
  *       the end of the saga to update the store.  That will help prevent state from
  *       getting broken in the case when `CHANGE_PAGE` actions overlap.
  *
  *       [1] - https://redux-saga.js.org/docs/advanced/TaskCancellation
  */
  takeLatest(C.CHANGE_PAGE, changePage),

  takeEvery(C.START_REFRESH_TIMER, restartBackgroundRefreshTimer),

  takeEvery(C.START_RESUME_NOTIFICATIONS_TIMER, startResumeNotificationsTimer),
  takeEvery(C.LOGOUT, logoutAndCancelScheduler),
]
//
//
