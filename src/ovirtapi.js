import $ from 'jquery'

import { logDebug } from './helpers'
import { Exception } from './exceptions'
import Selectors from './selectors'
import AppConfiguration from './config'

let OvirtApi = {}
OvirtApi = {
  _getLoginToken () { // redux store selector
    return Selectors.getLoginToken()
  },
  _assertLogin ({ methodName }) {
    if (!OvirtApi._getLoginToken()) {
      throw new Exception(`OvirtApi in '${methodName}': missing login`)
    }
  },
  _httpGet ({ url, custHeaders = { 'Accept': 'application/json', Filter: true } }) {
    logDebug(`_httpGet start: url="${url}"`)
    const headers = Object.assign({
      'Authorization': `Bearer ${OvirtApi._getLoginToken()}`,
    }, custHeaders)
    logDebug(`_httpGet: url="${url}", headers="${JSON.stringify(headers)}"`)

    return $.ajax(url, {
      type: 'GET',
      headers,
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpPost ({ url, input }) {
    return $.ajax(url, {
      type: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OvirtApi._getLoginToken()}`,
        'Filter': 'true',
      },
      data: input,
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpPut ({ url, input }) {
    return $.ajax(url, {
      type: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OvirtApi._getLoginToken()}`,
      },
      data: input,
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  /**
   * @param int/string - memory in biBytes
   * @returns int - memory in MB
   */
  _getVmMemory (memory) {
    if (typeof memory === 'string') {
      return Math.floor(parseInt(memory) / 1048576)
    } else if (typeof memory === 'number') {
      return Math.floor(memory / 1048576)
    } else {
      return memory
    }
  },
  // ----
  /**
   * @param vm - Single entry from oVirt REST /api/vms
   * @returns {} - Internal representation of a VM
   */
  vmToInternal ({ vm }) {
    function vCpusCount ({ cpu }) {
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
      description: vm['description'],
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
        id: vm['template'] ? vm.template['id'] : undefined,
      },
      cluster: {
        id: vm['cluster'] ? vm.cluster['id'] : undefined,
      },
      cpu: {
        arch: vm['cpu'] ? vm.cpu['architecture'] : undefined,
        vCPUs: vCpusCount({ cpu: vm['cpu'] }),
      },

      memory: {
        total: OvirtApi._getVmMemory(vm['memory']),
        guaranteed: vm['memory_policy'] ? OvirtApi._getVmMemory(vm.memory_policy['guaranteed']) : undefined,
      },

      os: {
        type: vm['os'] ? vm.os['type'] : undefined,
      },

      highAvailability: {
        enabled: vm['high_availability'] ? vm.high_availability['enabled'] : undefined,
        priority: vm['high_availability'] ? vm.high_availability['priority'] : undefined,
      },

      icons: {
        small: {
          id: vm['small_icon'] ? vm.small_icon['id'] : undefined,
        },
        large: {
          id: vm['large_icon'] ? vm.large_icon['id'] : undefined,
        },
      },
      disks: {},
      consoles: [],
    }
  },
  /**
   *
   * @param attachment - single entry from vms/[VM_ID]/diskattachments
   * @param disk - disk corresponding to the attachment
   * @returns {} - Internal representation of a single VM disk
   */
  diskToInternal ({ disk, attachment }) {
    function toBool (val) {
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
      format: disk['format'],
    }
  },
  templateToInternal ({ template }) {
    if (template.cluster) {
      return {
        id: template.id,
        name: template.name,
        description: template.description,
        cluster: template.cluster.id,
        memory: OvirtApi._getVmMemory(template.memory),
        cpu: template.cpu.topology.sockets,
        version_number: template.version.version_number,
        os: template.os.type,
      }
    }
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      cluster: '0',
      memory: OvirtApi._getVmMemory(template.memory),
      cpu: template.cpu.topology.sockets,
      version_number: template.version.version_number,
      os: template.os.type,
    }
  },
  clusterToInternal ({ cluster }) {
    return {
      id: cluster.id,
      name: cluster.name,
    }
  },
  OSToInternal ({ os }) {
    return {
      id: os.id,
      name: os.name,
      description: os.description,
    }
  },
  iconToInternal ({ icon }) {
    return {
      id: icon.id,
      type: icon['media_type'],
      data: icon.data,
    }
  },
  consolesToInternal ({ consoles }) {
    return consoles['graphics_console'].map(c => {
      return {
        id: c.id,
        protocol: c.protocol,
      }
    }).sort((a, b) => b.protocol.length - a.protocol.length) // Hack: 'VNC' is shorter then 'SPICE'
  },
  // ----
  login ({ credentials }) {
    const url = `${AppConfiguration.applicationContext}/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api`
    const user = credentials.username
    const pwd = credentials.password

    return $.ajax(url, {
      type: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + new Buffer(`${user}:${pwd}`, 'utf8').toString('base64'),
      },
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  getOvirtApiMeta () {
    OvirtApi._assertLogin({ methodName: 'checkOvirtApiVersion' })
    const url = `${AppConfiguration.applicationContext}/api/`
    return OvirtApi._httpGet({ url })
  },
  getVm ({ vmId }) {
    OvirtApi._assertLogin({ methodName: 'getVm' })
    const url = `${AppConfiguration.applicationContext}/api/vms/${vmId}`
    return OvirtApi._httpGet({ url })
  },
  getAllVms () {
    OvirtApi._assertLogin({ methodName: 'getAllVms' })
    const url = `${AppConfiguration.applicationContext}/api/vms`
    return OvirtApi._httpGet({ url })
  },
  shutdown ({ vmId, force }) {
    OvirtApi._assertLogin({ methodName: 'shutdown' })
    let restMethod = 'shutdown'
    if (force) {
      restMethod = 'stop'
    }
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/${restMethod}`, input: '{}' })
  },
  getAllTemplates () {
    OvirtApi._assertLogin({ methodName: 'getAllTemplates' })
    const url = '/api/templates'
    return OvirtApi._httpGet({ url })
  },
  getAllClusters () {
    OvirtApi._assertLogin({ methodName: 'getAllClusters' })
    const url = '/api/clusters'
    return OvirtApi._httpGet({ url })
  },
  getAllOperatingSystems () {
    OvirtApi._assertLogin({ methodName: 'getAllOperatingSystems' })
    const url = '/api/operatingsystems'
    return OvirtApi._httpGet({ url })
  },
  addNewVm ({ vm }) {
    OvirtApi._assertLogin({ methodName: 'addNewVm' })
    return OvirtApi._httpPost({ url: `/api/vms`, input: JSON.stringify(vm) })
  },
  editVm ({ vm, vmId }) {
    OvirtApi._assertLogin({ methodName: 'editVm' })
    return OvirtApi._httpPut({ url: `/api/vms/${vmId}`, input: JSON.stringify(vm) })
  },
  editTemplate ({ template, templateId }) {
    OvirtApi._assertLogin({ methodName: 'editTemplate' })
    return OvirtApi._httpPut({ url: `/api/templates/${templateId}`, input: JSON.stringify(template) })
  },
  start ({ vmId }) {
    OvirtApi._assertLogin({ methodName: 'start' })
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/start`, input: '{}' })
  },
  suspend ({ vmId }) {
    OvirtApi._assertLogin({ methodName: 'suspend' })
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/suspend`, input: '{}' })
  },
  restart ({ vmId }) { // 'force' is not exposed by oVirt API
    OvirtApi._assertLogin({ methodName: 'restart' })
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/reboot`, input: '{}' })
  },
  icon ({ id }) {
    OvirtApi._assertLogin({ methodName: 'icon' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/icons/${id}` })
  },
  diskattachments ({ vmId }) {
    OvirtApi._assertLogin({ methodName: 'diskattachments' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/diskattachments` })
  },
  disk ({ diskId }) {
    OvirtApi._assertLogin({ methodName: 'disk' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/disks/${diskId}` })
  },
  consoles ({ vmId }) {
    OvirtApi._assertLogin({ methodName: 'consoles' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles` })
  },
  console ({ vmId, consoleId }) {
    OvirtApi._assertLogin({ methodName: 'console' })
    return OvirtApi._httpGet({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles/${consoleId}`,
      custHeaders: { Accept: 'application/x-virt-viewer', Filter: true } })
  },
}

const Api = OvirtApi
export default Api
