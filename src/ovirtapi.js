// @flow

import $ from 'jquery'

import { logDebug } from './helpers'
import { Exception } from './exceptions'
import Selectors from './selectors'
import AppConfiguration from './config'

type VmIdType = { vmId: string }
type PoolIdType = { poolId: string }
type InputRequestType = { url: string, input: string, contentType?: string }
type VmType = { vm: Object }
type CloudInitInternalType = {
  enabled: boolean,
  hostName: string,
  sshAuthorizedKeys: string
}

const zeroUUID: string = '00000000-0000-0000-0000-000000000000'

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
      'Accept-Language': AppConfiguration.queryParams.locale, // can be: undefined, empty or string
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
        'Accept-Language': AppConfiguration.queryParams.locale,
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
        'Accept-Language': AppConfiguration.queryParams.locale,
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
  vmToInternal ({ vm, getSubResources }: { vm: Object, getSubResources: boolean }): Object {
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

    const parsedVm = {
      name: vm['name'],
      description: vm['description'],
      id: vm['id'],
      status: vm['status'] ? vm['status'].toLowerCase() : undefined,
      statusDetail: vm['status_detail'],
      type: vm['type'],
      nextRunExists: vm['next_run_configuration_exists'] === 'true',
      lastMessage: '',
      hostId: vm['host'] ? vm['host'].id : undefined,

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
      disks: [],
      consoles: [],
      pool: {
        id: vm['vm_pool'] ? vm.vm_pool['id'] : undefined,
      },
      cdrom: {},
      sessions: [],
      display: {
        smartcardEnabled: vm.display && vm.display.smartcard_enabled ? vm.display.smartcard_enabled === 'true' : false,
      },
      bootMenuEnabled: bootMenuToInternal(vm),
      cloudInit: cloudInitApiToInternal(vm),
    }
    if (getSubResources) {
      if (vm.disk_attachments && vm.disk_attachments.disk_attachment) {
        for (let i in vm.disk_attachments.disk_attachment) {
          parsedVm.disks.push(this.diskToInternal({ attachment: vm.disk_attachments.disk_attachment[i], disk: vm.disk_attachments.disk_attachment[i].disk }))
        }
      }

      if (vm.cdroms && vm.cdroms.cdrom) {
        parsedVm.cdrom = this.CDRomToInternal({ cdrom: vm.cdroms.cdrom[0] })
      }
      if (vm.graphics_consoles && vm.graphics_consoles.graphics_console) {
        parsedVm.consoles = this.consolesToInternal({ consoles: vm.graphics_consoles })
      }
      if (vm.sessions && vm.sessions.session) {
        parsedVm.sessions = this.sessionsToInternal({ sessions: vm.sessions })
      }
    }
    return parsedVm
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

      bios: {
        boot_menu: {
          enabled: vm.bootMenuEnabled,
        },
      },

      initialization: vm.cloudInit.enabled
        ? {
          host_name: vm.cloudInit.hostName,
          authorized_ssh_keys: vm.cloudInit.sshAuthorizedKeys,
        }
        : {},
    }
  },

  internalCDRomToOvirt ({ cdrom }: { cdrom: Object }): Object {
    return {
      file: {
        id: cdrom.file.id,
      },
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
      cloudInit: cloudInitApiToInternal(template),
      bootMenuEnabled: bootMenuToInternal(template),
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

  hostToInternal ({ host }: { host: Object }): Object {
    return {
      id: host.id,
      name: host.name,

      address: host.address,
      clusterId: host.cluster && host.cluster.id,
    }
  },

  OSToInternal ({ os }: { os: Object }): Object {
    return {
      id: os.id,
      name: os.name,
      description: os.description,
      icons: {
        small: {
          id: os['small_icon'] ? os.small_icon['id'] : undefined,
        },
        large: {
          id: os['large_icon'] ? os.large_icon['id'] : undefined,
        },
      },
    }
  },

  storageToInternal ({ storage }: { storage: Object }): Object {
    return {
      id: storage.id,
      name: storage.name,
      type: storage.type,
    }
  },

  fileToInternal ({ file }: { file: Object }): Object {
    return {
      id: file.id,
      name: file.name,
    }
  },

  sessionsToInternal ({ sessions }: { sessions: Object }): Object {
    return sessions['session'].map((c: Object): Object => {
      return {
        id: c.id,
        consoleUser: c.console_user === 'true',
        user: {
          id: c.user ? c.user.id : null,
        },
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

  CDRomToInternal ({ cdrom }: { cdrom: Object }): Object {
    return {
      id: cdrom.id,
      file: {
        id: cdrom.file ? cdrom.file.id : '',
      },
    }
  },

  SSHKeyToInternal ({ sshKey }: { sshKey: Object }): Object {
    return {
      id: sshKey.id,
      key: sshKey.content,
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
  getVmsByPage ({ page, additional }: { page: number, additional: Array<string> }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getVmsByPage' })
    let url = `${AppConfiguration.applicationContext}/api/vms/;max=${AppConfiguration.pageLimit}?search=SORTBY NAME ASC page ${page}`
    if (additional && additional.length > 0) {
      url += `&follow=${additional.join(',')}`
    }
    return OvirtApi._httpGet({ url })
  },
  getVmsByCount ({ count, additional }: { count: number, additional: Array<string> }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getVmsByCount' })
    let url = `${AppConfiguration.applicationContext}/api/vms/;max=${count}?search=SORTBY NAME ASC`
    if (additional && additional.length > 0) {
      url += `&follow=${additional.join(',')}`
    }
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
  getAllHosts (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getAllHosts' })
    const url = `${AppConfiguration.applicationContext}/api/hosts`
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
      input: JSON.stringify(OvirtApi.internalVmToOvirt({ vm })),
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
    return OvirtApi._httpGet({
      url: `${AppConfiguration.applicationContext}/api/permissions`,
      custHeaders: {
        Filter: false,
        Accept: 'application/json',
      },
    })
  },

  getPoolsByPage ({ page }: { page: number }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getPoolsByPage' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools/;max=${AppConfiguration.pageLimit}?search=SORTBY NAME ASC page ${page}`
    return OvirtApi._httpGet({ url })
  },

  getPoolsByCount ({ count }: { count: number }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getPoolsByCount' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools/;max=${count}`
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
  getStorages (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getStorages' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/storagedomains` })
  },
  getStorageFiles ({ storageId }: { storageId: string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getStorageFiles' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/storagedomains/${storageId}/files` })
  },

  getCDRom ({ vmId, running }: { vmId: string, running: boolean }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getCDRom' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/cdroms/${zeroUUID}?current=${running ? 'true' : 'false'}` })
  },

  changeCD ({ cdrom, vmId, running }: { cdrom: Object, vmId: string, running: boolean }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'changeCD' })
    const input = JSON.stringify(OvirtApi.internalCDRomToOvirt({ cdrom }))
    logDebug(`OvirtApi.changeCD(): ${input}`)
    return OvirtApi._httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/cdroms/${zeroUUID}?current=${running ? 'true' : 'false'}`,
      input,
    })
  },
  getUSBFilter (): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getUSBFilter' })
    return OvirtApi._httpGet({
      url: `${AppConfiguration.applicationContext}/services/files/usbfilter.txt`,
      custHeaders: {
        'Accept': 'text/plain',
      },
    })
  },
  changeIcon ({ vmId, iconBase64, mimeType }: { vmId: string, iconBase64: string, mimeType: string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'changeIcon' })
    const input = JSON.stringify({ large_icon: { data: iconBase64, media_type: mimeType } })
    return OvirtApi._httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}`,
      input,
    })
  },
  changeIconById ({ vmId, iconId }: { vmId: string, iconId: string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'changeIconById' })
    const input = JSON.stringify({ large_icon: { id: iconId } })
    return OvirtApi._httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}`,
      input,
    })
  },
  saveSSHKey ({ key, userId, sshId }: { key: string, userId: string, sshId: ?string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'saveSSHKey' })
    const input = JSON.stringify({ content: key })
    if (sshId !== undefined && sshId !== null) {
      return OvirtApi._httpPut({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys/${sshId}`,
        input,
      })
    } else {
      return OvirtApi._httpPost({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys`,
        input,
      })
    }
  },
  getSSHKey ({ userId }: { userId: string }): Promise<Object> {
    OvirtApi._assertLogin({ methodName: 'getSSHKey' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys` })
  },

  /**
   * @return {Promise.<?string>} promise of option value if options exists, promise of null otherwise.
   *                             If default value is provided, the method never returns rejected promise and the default
   *                             value is returned in case of missing option or any error.
   */
  getOption ({ optionName, version, defaultValue }: {optionName: string, version: string, defaultValue?: string}): Promise<?string> {
    const rawPromise = getOptionWithoutDefault(optionName, version)

    if (!defaultValue) {
      return rawPromise
    }

    return rawPromise
      .then(result => result === null ? defaultValue : result)
      .catch(() => defaultValue)
  },
}

function bootMenuToInternal (vmLike: Object): boolean {
  return vmLike.bios && vmLike.bios.boot_menu && vmLike.bios.boot_menu.enabled === 'true'
}

function cloudInitApiToInternal (vmLike: Object): CloudInitInternalType {
  return {
    enabled: !!vmLike.initialization,
    hostName: (vmLike.initialization && vmLike.initialization.host_name) || '',
    sshAuthorizedKeys: (vmLike.initialization && vmLike.initialization.authorized_ssh_keys) || '',
  }
}

/**
 * @typedef {'general' | '4.2' | '4.1' | '4.0'} OptionVersionType
 */
/**
 *
 * @param {string} optionName
 * @param {OptionVersionType} version
 * @return {Promise.<?string>} promise of option value if options exists, promise of null otherwise.
 */
function getOptionWithoutDefault (optionName: string, version: string): Promise<?string> {
  OvirtApi._assertLogin({ methodName: 'getOption' })
  return OvirtApi._httpGet({
    url: `${AppConfiguration.applicationContext}/api/options/${optionName}`,
    custHeaders: {
      Accept: 'application/json',
      Filter: true,
    },
  })
    .then(response => {
      let result
      try {
        result = response.values.system_option_value
          .filter((valueAndVersion) => valueAndVersion.version === version)
          .map(valueAndVersion => valueAndVersion.value)[0]
      } catch (error) {
        if (error instanceof TypeError) {
          logDebug(`Response to getting option '${optionName}' has unexpected format:`, response)
        }
        throw error
      }
      if (result === undefined) {
        logDebug(`Config option '${optionName}' was not found for version '${version}'.`)
        return null
      }
      return result
    }, error => {
      if (error.status === 404) {
        logDebug(`Config option '${optionName}' doesn't exist in any version.`)
        return null
      }
      throw error
    })
}

const Api = OvirtApi
export default Api
