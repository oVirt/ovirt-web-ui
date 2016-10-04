/**
 * Created by mlibra on 27.9.16.
 */
import $ from 'jquery'
import {logDebug} from './helpers'
import {Exception} from './exceptions'

let OvirtApi = {}

OvirtApi = {
  init ({store}) {
    this.store = store // for connection details
  },
  // ----
  _getLoginToken () { // redux store selector
    OvirtApi._assertStore({methodName: '_getLoginToken'})
    return OvirtApi.store.getState().config.get('loginToken')
  },
  _assertStore ({methodName}) {
    if (!this.store) {
      throw new Exception(`OvirtApi in '${methodName}' uninitialized - missing store. Call the Api.init() method`)
    }
  },
  _assertLogin ({methodName}) {
    if (!OvirtApi._getLoginToken()) {
      throw new Exception(`OvirtApi in '${methodName}': missing login`)
    }
  },
  _httpGet ({url}) {
    return $.ajax(url, {
      type: "GET",
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${OvirtApi._getLoginToken().get('access_token')}`,
        'Filter': false
      }
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpPost ({url, input}) {
    return $.ajax(url, {
      type: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/xml',
        'Authorization': `Bearer ${OvirtApi._getLoginToken().get('access_token')}`
      },
      data: input
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  // ----
  /**
   * @param vm - Single entry from oVirt REST /api/vms
   * @returns {} - Internal representation of a VM
   */
  vmToInternal ({vm}) {
    function vCpusCount({cpu}) {
      logDebug(`-----vCpusCount() cpu='${JSON.stringify(cpu)}'`)
      if (cpu && cpu.topology) {
        const top = cpu.topology
        let total = top.sockets ? top.sockets : 0
        total = total * (top.cores ? top.cores : 0)
        total = total * (top.threads ? top.threads : 0)
        return total
      }
      return 0
    }

    return {
      name: vm['name'],
      id: vm['id'],
      status: vm['status'] ? vm['status'].toLowerCase() : undefined,
      type: vm['type'],
      lastMessage: '',

      // TODO: improve time conversion
      startTime: vm['start_time'] ? (new Date(vm['start_time'])).toUTCString() : undefined,
      stopTime: vm['stop_time'] ? (new Date(vm['stop_time'])).toUTCString() : undefined,
      creationTime: vm['creation_time'] ? (new Date(vm['creation_time'])).toUTCString() : undefined,
      startPaused: vm['start_paused'],

      fqdn: vm['fqdn'],

      template: {
        id: vm['template'] ? vm.template['id'] : undefined
      },
      cluster: {
        id: vm['cluster'] ? vm.cluster['id'] : undefined
      },
      cpu: {
        arch: vm['cpu'] ? vm.cpu['architecture'] : undefined,
        vCPUs: vCpusCount({cpu: vm['cpu']})
      },

      memory: {
        total: vm['memory'],
        guaranteed: vm['memory_policy'] ? vm.memory_policy['guaranteed'] : undefined
      },

      os: {
        type: vm['os'] ? vm.os['type'] : undefined
      },

      highAvailability: {
        enabled: vm['high_availability'] ? vm.high_availability['enabled'] : undefined,
        priority: vm['high_availability'] ? vm.high_availability['priority'] : undefined
      },

      icons: {
        small: {
          id: vm['small_icon'] ? vm.small_icon['id'] : undefined
        },
        large: {
          id: vm['large_icon'] ? vm.large_icon['id'] : undefined
        }
      }
    }
  },
  // ----
  login ({credentials}) {
    const url = '/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api'
    const user = credentials.username
    const pwd = credentials.password

    return $.ajax(url, {
      type: "GET",
      headers: {
        'Accept': 'application/json',
        'Authorization': "Basic " + new Buffer(`${user}:${pwd}`, 'utf8').toString('base64')
      }
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  getAllVms () {
    OvirtApi._assertLogin({methodName: 'getAllVms'})
    const url = '/api/vms'
    return OvirtApi._httpGet({url})
  },
  shutdown ({vmId}) {
    OvirtApi._assertLogin({methodName: 'shutdown'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/shutdown`, input: '<action />'})
  },
  start ({vmId}) {
    OvirtApi._assertLogin({methodName: 'start'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/start`, input: '<action />'})
  },
  restart ({vmId}) {
    OvirtApi._assertLogin({methodName: 'restart'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/reboot`, input: '<action />'})
  },
  icon ({id}) {
    OvirtApi._assertLogin({methodName: 'icon'})
    return OvirtApi._httpGet({url: `/api/icons/${id}`})
  }
}

export default OvirtApi
