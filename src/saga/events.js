import Selectors from '../selectors'
import Api from '../ovirtapi'

import {
  put,
} from 'redux-saga/effects'

import { logDebug, logError } from '../helpers'

import {
  callExternalAction,
  delay,
  foreach,
  isOvirt42OrHigher,
  waitForIt,
} from './utils'

import {
  getEvents,
  refresh,

  getSingleHost,
  getSingleVm,
  getSingleCluster,
  getSingleTemplate,
} from '../actions'

import { refreshData } from '../sagas' // TODO: move to separate file to avoid cyclic dependency

export function* eventListener () {
  console.info('Starting oVirt event listener')

  const passed = yield * waitForIt(() => Selectors.isOvirtVersionCheckPassed())
  if (passed && isOvirt42OrHigher()) {
    yield eventListenerV42()
  } else {
    yield eventListenerVLower()
  }
}

/**
 * oVirt < 4.1 events are hard to parse for changes, so let's keep polling
 */
export function * eventListenerVLower () {
  console.info('--- Starting oVirt event listener, eventListenerVLower()')
  while (true) {
    yield delay(60 * 1000) // 60 seconds delay since last data load finished
    console.info('eventListenerVLower(): Refreshing data')
    yield refreshData(refresh({ page: Selectors.getCurrentPage(), quiet: true, shallowFetch: false }))
  }
}

/**
 * oVirt >= 4.2 events contain affected subresources.
 */
export function * eventListenerV42 () {
  console.info('--- Starting oVirt event listener, eventListenerV42()')
  let lastReceivedEventIndex = -1
  while (true) {
    yield delay(5 * 1000) // 5 seconds
    logDebug('Checking for new oVirt events')

    const oVirtVersion = Selectors.getOvirtVersion()
    if (!oVirtVersion.get('passed')) {
      logError('eventListener(): oVirt version check failed')
      break
    }

    const events = yield callExternalAction('getEvents', Api.getEvents, getEvents({ lastReceivedEventIndex }))
    if (events && events.event) {
      const resources = {}

      yield * foreach(events.event, function* (event) {
        logDebug('Event received: ', event)
        lastReceivedEventIndex = event.index > lastReceivedEventIndex ? event.index : lastReceivedEventIndex
        yield * parseEvent(event, resources)
      })

      yield * refreshResources(resources)
    } else {
      logDebug('No new event received: ', events)
    }
  }
}

function * parseEvent (event, resources) {
  // TODO: improve refresh decision based on event type and not just on presence of related resource
  if (event.host && event.host.id) {
    resources.hosts = resources.hosts || {}
    resources.hosts[event.host.id] = true
  }

  if (event.vm && event.vm.id) {
    resources.vms = resources.vms || {}
    resources.vms[event.vm.id] = true
  }

  if (event.template && event.template.id) {
    resources.templates = resources.templates || {}
    resources.templates[event.template.id] = true
  }

  if (event.cluster && event.cluster.id) {
    resources.clusters = resources.clusters || {}
    resources.clusters[event.cluster.id] = true
  }
}

function * refreshResources (resources) {
  if (resources.hosts && Object.getOwnPropertyNames(resources.hosts)) {
    yield * foreach(Object.getOwnPropertyNames(resources.hosts), function* (id) {
      yield put(getSingleHost({ id }))
    })
  }

  if (resources.vms && Object.getOwnPropertyNames(resources.vms)) {
    yield * foreach(Object.getOwnPropertyNames(resources.vms), function* (id) {
      yield put(getSingleVm({ vmId: id }))
    })
  }

  if (resources.templates && Object.getOwnPropertyNames(resources.templates)) {
    yield * foreach(Object.getOwnPropertyNames(resources.templates), function* (id) {
      yield put(getSingleTemplate({ id }))
    })
  }

  if (resources.clusters && Object.getOwnPropertyNames(resources.clusters)) {
    yield * foreach(Object.getOwnPropertyNames(resources.clusters), function* (id) {
      yield put(getSingleCluster({ id }))
    })
  }
}
