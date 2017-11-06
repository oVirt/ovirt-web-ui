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
} from './utils'

import {
  getEvents,

  getSingleHost,
  getSingleVm,
  getSingleCluster,
  getSingleTemplate,
} from '../actions'

export function* eventListener () {
  logDebug('Starting oVirt event listener')

  let lastEventIndexReceived = -1
  while (true) {
    yield delay(5 * 1000) // 5 seconds
    logDebug('Checking for new oVirt events')

    const oVirtVersion = Selectors.getOvirtVersion()
    if (!oVirtVersion.get('passed')) {
      logError('eventListener(): oVirt version check failed')
      break
    }

    const events = yield callExternalAction('getEvents', Api.getEvents, getEvents({ lastEventIndexReceived }))
    if (events && events.event) {
      const resources = {}

      yield * foreach(events.event, function* (event) {
        logDebug('Event received: ', event)
        lastEventIndexReceived = event.index > lastEventIndexReceived ? event.index : lastEventIndexReceived
        yield * parseEvent(event, resources)
      })

      yield * refreshResources(resources)
    } else {
      logDebug('No new event received: ', events)
    }
  }
}

// TODO: requires oVirt >= 4.2
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
  if (resources.hosts) {
    yield * foreach(Object.getOwnPropertyNames(resources.hosts), function* (id) {
      yield put(getSingleHost({ id }))
    })
  }

  if (resources.vms) {
    yield * foreach(Object.getOwnPropertyNames(resources.vms), function* (id) {
      yield put(getSingleVm({ vmId: id }))
    })
  }

  if (resources.templates) {
    yield * foreach(Object.getOwnPropertyNames(resources.templates), function* (id) {
      yield put(getSingleTemplate({ id }))
    })
  }

  if (resources.clusters) {
    yield * foreach(Object.getOwnPropertyNames(resources.clusters), function* (id) {
      yield put(getSingleCluster({ id }))
    })
  }
}
