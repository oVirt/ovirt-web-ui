// @flow

import $ from 'jquery'

import { logDebug } from './helpers'
import { Exception } from './exceptions'
import Selectors from './selectors'
import AppConfiguration from './config'

type VmIdType = { vmId: string };
type PoolIdType = { poolId: string };
type InputRequestType = { url: string, input: string, contentType?: string };
type VmType = { vm: Object };

let OvirtApi = {}
OvirtApi = {
  _getLoginToken (): string { // redux store selector
    return Selectors.getLoginToken()
  },
  _assertLogin ({ methodName }: { methodName: string }) {
    if (!OvirtApi._getLoginToken()) {
      throw new Exception(`OvirtApi in '${methodName}': missing login`)
    }
    if (Selectors.isTokenExpired()) {
      throw new Exception(`OvirtApi in '${methodName}': sso token is expired`)
    }
  },
  _httpGet ({ url, custHeaders = { 'Accept': 'application/json', Filter: Selectors.getFilter() } }: { url: string, custHeaders?: Object}): Promise<Object> {
    logDebug(`_httpGet start: url="${url}"`)
    const headers = Object.assign({
      'Authorization': `Bearer ${OvirtApi._getLoginToken()}`,
    }, custHeaders)
    logDebug(`_httpGet: url="${url}", headers="${JSON.stringify(headers)}"`)

    return $.ajax(url, {
      type: 'GET',
      headers,
    }).then((data: Object): Promise<Object> => Promise.resolve(data))
      .catch((data: Object): Promise<Object> => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpPost ({ url, input, contentType = 'application/json' }: InputRequestType): Promise<Object> {
    return $.ajax(url, {
      type: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': contentType,
        'Authorization': `Bearer ${OvirtApi._getLoginToken()}`,
        'Filter': 'true',
      },
      data: input,
    }).then((data: Object): Promise<Object> => Promise.resolve(data))
      .catch((data: Object): Promise<Object> => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpPut ({ url, input, contentType = 'application/json' }: InputRequestType): Promise<Object> {
    return $.ajax(url, {
      type: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': contentType,
        'Authorization': `Bearer ${OvirtApi._getLoginToken()}`,
      },
      data: input,
    }).then((data: Object): Promise<Object> => Promise.resolve(data))
      .catch((data: Object): Promise<Object> => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpDelete ({ url, custHeaders = { 'Accept': 'application/json' } }: { url: string, custHeaders?: Object }): Promise<Object> {
    const headers = Object.assign({
      'Authorization': `Bearer ${OvirtApi._getLoginToken()}`,
    }, custHeaders)
    logDebug(`_httpDelete: url="${url}", headers="${JSON.stringify(headers)}"`)

    return $.ajax(url, {
      type: 'DELETE',
      headers,
    }).then((data: Object): Promise<Object> => Promise.resolve(data))
      .catch((data: Object): Promise<Object> => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },

  // ----
  /**
   * @param vm - Single entry from oVirt REST /api/vms
   * @returns {} - Internal representation of a VM
   */
  vmToInternal ({ vm }: VmType): Object {
    function vCpusCount ({ cpu }: { cpu: Object }): number {
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
        topology: vm.cpu && vm.cpu.topology ? {
          cores: vm.cpu.topology.cores,
          sockets: vm.cpu.topology.sockets,
          threads: vm.cpu.topology.threads,
        } : undefined,
      },

      memory: {
        total: vm['memory'],
        guaranteed: vm['memory_policy'] ? vm.memory_policy['guaranteed'] : undefined,
        max: vm['memory_policy'] ? vm.memory_policy['max'] : undefined,
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
      pool: {
        id: vm['vm_pool'] ? vm.vm_pool['id'] : undefined,
      },
    }
  },
  // ----
  /**
   * @param pool - Single entry from oVirt REST /api/pools
   * @returns {} - Internal representation of a Pool
   */
  poolToInternal ({ pool }: { pool: Object }): Object {
    return {
      name: pool['name'],
      description: pool['description'],
      id: pool['id'],
      status: 'down',
      type: pool['type'],
      lastMessage: '',

      size: pool['size'],
      maxUserVms: pool['max_user_vms'],
      preStartedVms: pool['prestarted_vms'],
      vm: this.vmToInternal({ vm: pool.vm }),
      vmsCount: 0,
    }
  },

  internalVmToOvirt ({ vm }: VmType): Object {
    return {
      name: vm.name,
      description: vm.description,
      id: vm.id,
      type: vm.type,

      memory: vm.memory,
      cpu: {
        topology: {
          cores: vm.cpu.topology.cores,
          sockets: vm.cpu.topology.sockets,
          threads: vm.cpu.topology.threads,
        },
      },

      template: vm.template && vm.template.id ? {
        id: vm.template.id,
      } : undefined,

      cluster: vm.cluster && vm.cluster.id ? {
        id: vm.cluster.id,
      } : undefined,

      os: vm.os && vm.os.type ? {
        type: vm.os.type,
      } : undefined,
    }
  },

  /**
   *
   * @param attachment - single entry from vms/[VM_ID]/diskattachments
   * @param disk - disk corresponding to the attachment
   * @returns {} - Internal representation of a single VM disk
   */
  diskToInternal ({ disk, attachment }: { disk: Object, attachment: Object }): Object {
    function toBool (val?: string): boolean {
      return val !== undefined && val.toLowerCase() === 'true'
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

  templateToInternal ({ template }: { template: Object}): Object {
    const version = {
      name: template.version ? template.version.version_name : undefined,
      number: template.version ? template.version.version_number : undefined,
      baseTemplateId: template.version && template.version.base_template ? template.version.base_template.id : undefined,
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      clusterId: template.cluster ? template.cluster.id : null,
      memory: template.memory,

      cpu: {
        topology: {
          cores: template.cpu.topology.cores,
          sockets: template.cpu.topology.sockets,
          threads: template.cpu.topology.threads,
        },
      },

      version,
      os: {
        type: template.os ? template.os.type : undefined,
      },

    }
  },
  clusterToInternal ({ cluster }: { cluster: Object }): Object {
    return {
      id: cluster.id,
      name: cluster.name,

      memoryPolicy: {
        overCommitPercent: cluster['memory_policy'] && cluster['memory_policy']['over_commit'] && cluster['memory_policy']['over_commit']['percent'] ? cluster['memory_policy']['over_commit']['percent'] : 100,
      },
    }
  },

  OSToInternal ({ os }: { os: Object }): Object {
    return {
      id: os.id,
      name: os.name,
      description: os.description,
    }
  },

  sessionsToInternal ({ sessions }: { sessions: Object }): Object {
    return sessions['session'].map((c: Object): Object => {
      return {
        id: c.id,
        consoleUser: c.console_user === 'true',
      }
    })
  },

  iconToInternal ({ icon }: { icon: Object }): Object {
    return {
      id: icon.id,
      type: icon['media_type'],
      data: icon.data,
    }
  },

  consolesToInternal ({ consoles }: { consoles: Object }): Array<Object> {
    return consoles['graphics_console'].map((c: Object): Object => {
      return {
        id: c.id,
        protocol: c.protocol,
      }
    }).sort((a: Object, b: Object): number => b.protocol.length - a.protocol.length) // Hack: 'VNC' is shorter then 'SPICE'
  },
  // ----
  login ({ credentials }: { credentials: { username: string, password: string }}): Promise<Object> {
    const url = `${AppConfiguration.applicationContext}/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api`
    const user = credentials.username
    const pwd = credentials.password

    return $.ajax(url, {
      type: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + new Buffer(`${user}:${pwd}`, 'utf8').toString('base64'),
      },
    }).then((data: Object): Promise<Object> => Promise.resolve(data))
      .catch((data: Object): Promise<Object> => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  getOvirtApiMeta (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'checkOvirtApiVersion' })
    const url = `${AppConfiguration.applicationContext}/api/`
    return OvirtApi._httpGet({ url })
  },
  getVm ({ vmId }: VmIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getVm' })
    const url = `${AppConfiguration.applicationContext}/api/vms/${vmId}`
    return OvirtApi._httpGet({ url })
  },
  getAllVms (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getAllVms' })
    const url = `${AppConfiguration.applicationContext}/api/vms`
    return OvirtApi._httpGet({ url })
  },
  shutdown ({ vmId, force }: { vmId: string, force: boolean }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'shutdown' })
    let restMethod = 'shutdown'
    if (force) {
      restMethod = 'stop'
    }
    return OvirtApi._httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/${restMethod}`,
      input: '{}',
    })
  },
  remove ({ vmId, force, preserveDisks }: { vmId: string, force: boolean, preserveDisks: boolean }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'remove' })
    let url = `${AppConfiguration.applicationContext}/api/vms/${vmId}`
    if (preserveDisks) {
      url = url + ';detach_only=true'
    }
    return OvirtApi._httpDelete({
      url,
      custHeaders: {
        'Accept': 'application/json',
        force: !!force,
      },
    })
  },
  getAllTemplates (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getAllTemplates' })
    const url = `${AppConfiguration.applicationContext}/api/templates`
    return OvirtApi._httpGet({ url })
  },
  getAllClusters (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getAllClusters' })
    const url = `${AppConfiguration.applicationContext}/api/clusters`
    return OvirtApi._httpGet({ url })
  },
  getAllOperatingSystems (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getAllOperatingSystems' })
    const url = `${AppConfiguration.applicationContext}/api/operatingsystems`
    return OvirtApi._httpGet({ url })
  },
  addNewVm ({ vm }: VmType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'addNewVm' })
    const input = JSON.stringify(OvirtApi.internalVmToOvirt({ vm }))
    logDebug(`OvirtApi.addNewVm(): ${input}`)
    return OvirtApi._httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms`,
      input,
    })
  },
  editVm ({ vm }: VmType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'editVm' })
    return OvirtApi._httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vm.id}`,
      input: JSON.stringify(vm),
    })
  },
  start ({ vmId }: VmIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'start' })
    return OvirtApi._httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/start`,
      input: '{}' })
  },
  suspend ({ vmId }: VmIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'suspend' })
    return OvirtApi._httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/suspend`,
      input: '{}',
    })
  },
  restart ({ vmId }: VmIdType): Promise<Object> { // 'force' is not exposed by oVirt API
    OvirtApi._assertLogin({ methodName: 'restart' })
    return OvirtApi._httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/reboot`,
      input: '{}',
    })
  },
  startPool ({ poolId }: PoolIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'startPool' })
    return OvirtApi._httpPost({
      url: `${AppConfiguration.applicationContext}/api/vmpools/${poolId}/allocatevm`,
      input: '<action />',
      contentType: 'application/xml',
    })
  },
  icon ({ id }: { id: string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'icon' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/icons/${id}` })
  },
  diskattachments ({ vmId }: VmIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'diskattachments' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/diskattachments` })
  },
  disk ({ diskId }: { diskId: string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'disk' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/disks/${diskId}` })
  },
  consoles ({ vmId }: VmIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'consoles' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles` })
  },
  console ({ vmId, consoleId }: { vmId: string, consoleId: string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'console' })
    return OvirtApi._httpGet({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles/${consoleId}`,
      custHeaders: { Accept: 'application/x-virt-viewer', Filter: Selectors.getFilter() } })
  },
  checkFilter (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'checkFilter' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/permissions`, custHeaders: { Filter: false } })
  },

  getAllPools (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getAllPools' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools`
    return OvirtApi._httpGet({ url })
  },

  getPool ({ poolId }: PoolIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getPool' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools/${poolId}`
    return OvirtApi._httpGet({ url })
  },
  sessions ({ vmId }: VmIdType): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'sessions' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/sessions` })
  },
}

const Api = OvirtApi
export default Api
