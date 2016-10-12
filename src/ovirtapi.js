import $ from 'jquery'

import {logDebug} from 'ovirt-ui-components'
import {Exception} from './exceptions'

let OvirtApi = {}
OvirtApi = {
  init ({store}) { // TODO: avoid init method
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
  _httpGet ({url, custHeaders = {'Accept': 'application/json', Filter: false}}) {
    logDebug(`_httpGet start: url="${url}"`)
    const headers = Object.assign({
      'Authorization': `Bearer ${OvirtApi._getLoginToken().get('access_token')}`
    }, custHeaders)
    logDebug(`_httpGet: url="${url}", headers="${JSON.stringify(headers)}"`)

    return $.ajax(url, {
      type: 'GET',
      headers
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpPost ({url, input}) {
    return $.ajax(url, {
      type: 'POST',
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
    function vCpusCount ({cpu}) {
      if (cpu && cpu.topology) {
        const top = cpu.topology
        let total = top.sockets ? top.sockets : 0
        total *= (top.cores ? top.cores : 0)
        total *= (top.threads ? top.threads : 0)
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
  /**
   *
   * @param attachment - single entry from vms/[VM_ID]/diskattachments
   * @param disk - disk corresponding to the attachment
   * @returns {} - Internal representation of a single VM disk
   */
  diskToInternal({disk, attachment}) {
    function toBool(val) {
      return val && val.toLowerCase() === 'true'
    }

    return {
      bootable: toBool(attachment['bootable']),
      active: toBool(attachment['active']),
      iface: attachment['interface'],

      id: disk.id,
      name: disk['name'],
      status: disk['status'],

      actualSize: disk['actual_size'],
      provisionedSize: disk['provisioned_size'],
      format: disk['format']
    }
  },
  // ----
  login ({credentials}) {
    const url = '/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api'
    const user = credentials.username
    const pwd = credentials.password

    return $.ajax(url, {
      type: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + new Buffer(`${user}:${pwd}`, 'utf8').toString('base64')
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
  suspend ({vmId}) {
    OvirtApi._assertLogin({methodName: 'start'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/suspend`, input: '<action />'})
  },
  restart ({vmId}) {
    OvirtApi._assertLogin({methodName: 'restart'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/reboot`, input: '<action />'})
  },
  icon ({id}) {
    OvirtApi._assertLogin({methodName: 'icon'})
    return OvirtApi._httpGet({url: `/api/icons/${id}`})
  },
  diskattachments ({vmId}) {
    OvirtApi._assertLogin({methodName: 'diskattachments'})
    return OvirtApi._httpGet({url: `/api/vms/${vmId}/diskattachments`})
  },
  disk ({diskId}) {
    OvirtApi._assertLogin({methodName: 'disk'})
    return OvirtApi._httpGet({url: `/api/disks/${diskId}`})
  },
  consoles ({vmId}) {
    OvirtApi._assertLogin({methodName: 'consoles'})
    return OvirtApi._httpGet({url: `/api/vms/${vmId}/graphicsconsoles`})
  },
  console ({vmId, consoleId}) {
    OvirtApi._assertLogin({methodName: 'console'})
    return OvirtApi._httpGet({url: `/api/vms/${vmId}/graphicsconsoles/${consoleId}`, custHeaders: {Accept: 'application/x-virt-viewer'}})
  }
}

const Api = OvirtApi
export default Api
