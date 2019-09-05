// @flow

import type {
  ApiCdRomType, CdRomType,
  ApiCloudInitType, CloudInitType,
  ApiClusterType, ClusterType,
  ApiDataCenterType, DataCenterType,
  ApiDiskAttachmentType, ApiDiskType, DiskType,
  ApiHostType, HostType,
  ApiIconType, IconType,
  ApiNetworkType, NetworkType,
  ApiNicType, NicType,
  ApiOsType, OsType,
  ApiPoolType, PoolType,
  ApiSnapshotType, SnapshotType,
  ApiSshKeyType, SshKeyType,
  ApiStorageDomainFileType, StorageDomainFileType,
  ApiStorageDomainType, StorageDomainType,
  ApiTemplateType, TemplateType,
  ApiVmConsolesType, VmConsolesType,
  ApiVmSessionsType, VmSessionsType,
  ApiVmStatisticType, VmStatisticsType,
  ApiVmType, VmType,
  ApiVnicProfileType, VnicProfileType,
  ApiPermissionType, PermissionType,
  ApiEventType, EventType,
} from './types'

import {
  canUserChangeCd,
  canUserUseCluster,
  canUserEditVm,
  canUserEditVmStorage,
  getUserPermits,
  canUserUseVnicProfile,
  canUserManipulateSnapshots,
} from '../utils'

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

function convertEpoch (epoch: number, defaultValue: ?Date = undefined): ?Date {
  return epoch ? new Date(epoch) : defaultValue
}

function convertBool (val: ?string): boolean {
  return val ? val.toLowerCase() === 'true' : false
}

function convertInt (val: ?(number | string), defaultValue: number = Number.NaN): number {
  if (val) {
    return typeof val === 'number' ? val : Number.parseInt(val, 10)
  }
  return defaultValue
}

function cleanUndefined (obj: Object): Object {
  for (let key in obj) {
    if (obj[key] === undefined) delete obj[key]
  }
  return obj
}

//
//
const VM = {
  toInternal ({ vm, includeSubResources = false }: { vm: ApiVmType, includeSubResources?: boolean }): VmType {
    const parsedVm: Object = {
      name: vm['name'],
      description: vm['description'],
      id: vm['id'],
      status: vm['status'] ? vm['status'].toLowerCase() : undefined,
      statusDetail: vm['status_detail'],
      type: vm['type'],
      nextRunExists: convertBool(vm['next_run_configuration_exists']),
      lastMessage: '',
      hostId: vm['host'] ? vm['host'].id : undefined,

      startTime: convertEpoch(vm['start_time']),
      stopTime: convertEpoch(vm['stop_time']),
      creationTime: convertEpoch(vm['creation_time']),
      startPaused: convertBool(vm['start_paused']),

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
        bootDevices: vm.os && vm.os.boot && vm.os.boot.devices && vm.os.boot.devices.device
          ? vm.os.boot.devices.device : [],
      },

      highAvailability: {
        enabled: vm['high_availability'] ? vm.high_availability['enabled'] : undefined,
        priority: vm['high_availability'] ? vm.high_availability['priority'] : undefined,
      },

      icons: {
        large: {
          id: vm['large_icon'] ? vm.large_icon['id'] : undefined,
        },
      },
      disks: [],
      consoles: [],
      snapshots: [],
      pool: {
        id: vm['vm_pool'] ? vm.vm_pool['id'] : undefined,
      },
      cdrom: {},
      sessions: [],
      nics: [],
      statistics: [],
      permits: new Set(),
      canUserChangeCd: true,
      canUserEditVm: false,
      canUserManipulateSnapshots: false,

      ssoGuestAgent: vm.sso.methods && vm.sso.methods.method && vm.sso.methods.method.length > 0 && vm.sso.methods.method.findIndex(method => method.id === 'guest_agent') > -1,
      display: {
        smartcardEnabled: vm.display && vm.display.smartcard_enabled && convertBool(vm.display.smartcard_enabled),
      },
      bootMenuEnabled: vm.bios && vm.bios.boot_menu && convertBool(vm.bios.boot_menu.enabled),
      cloudInit: CloudInit.toInternal({ vm }),
    }

    if (includeSubResources) {
      if (vm.cdroms && vm.cdroms.cdrom) {
        parsedVm.cdrom = CdRom.toInternal({ cdrom: vm.cdroms.cdrom[0] }) // in oVirt there is always exactly 1 cdrom
      }

      if (vm.graphics_consoles && vm.graphics_consoles.graphics_console) {
        parsedVm.consoles = VmConsoles.toInternal({ consoles: vm.graphics_consoles })
      }

      if (vm.disk_attachments && vm.disk_attachments.disk_attachment) {
        parsedVm.disks = vm.disk_attachments.disk_attachment.map(
          attachment => DiskAttachment.toInternal({ attachment, disk: attachment.disk })
        )
      }

      if (vm.nics && vm.nics.nic) {
        parsedVm.nics = vm.nics.nic.map(
          nic => Nic.toInternal({ nic })
        )
      }

      if (vm.sessions && vm.sessions.session) {
        parsedVm.sessions = VmSessions.toInternal({ sessions: vm.sessions })
      }

      if (vm.snapshots && vm.snapshots.snapshot) {
        parsedVm.snapshots = vm.snapshots.snapshot.map(
          snapshot => Snapshot.toInternal({ snapshot })
        )
      }

      if (vm.statistics && vm.statistics.statistic) {
        parsedVm.statistics = VmStatistics.toInternal({ statistics: vm.statistics.statistic })
      }

      if (vm.permissions && vm.permissions.permission) {
        parsedVm.permits = getUserPermits(Permissions.toInternal({
          permissions: vm.permissions.permission,
        }))
        parsedVm.canUserChangeCd = canUserChangeCd(parsedVm.permits)
        parsedVm.canUserEditVm = canUserEditVm(parsedVm.permits)
        parsedVm.canUserManipulateSnapshots = canUserManipulateSnapshots(parsedVm.permits)
        parsedVm.canUserEditVmStorage = canUserEditVmStorage(parsedVm.permits)
      }
    }

    return parsedVm
  },

  /*
   * Convert an internal VmType to the API structure.  The transform handles a **partial**
   * internal VM object and will only include **available** keys/values in the API
   * structure output.
   */
  toApi ({ vm }: { vm: VmType }): ApiVmType {
    return {
      id: vm.id,
      name: vm.name,
      description: vm.description,
      type: vm.type,

      memory: vm.memory,
      memory_policy: vm.memory_policy && {
        max: vm.memory_policy.max,
        guaranteed: vm.memory_policy.guaranteed,
      },

      cpu: vm.cpu && {
        topology: vm.cpu.topology && {
          cores: vm.cpu.topology.cores,
          sockets: vm.cpu.topology.sockets,
          threads: vm.cpu.topology.threads,
        },
      },

      template: vm.template && vm.template.id && {
        id: vm.template.id,
      },

      cluster: vm.cluster && vm.cluster.id && {
        id: vm.cluster.id,
      },

      os: vm.os && (vm.os.type || vm.os.bootDevices) && {
        type: vm.os.type || undefined,
        boot: vm.os.bootDevices && {
          devices: {
            device: vm.os.bootDevices.filter((item) => item !== null),
          },
        },
      },

      bios: vm.hasOwnProperty('bootMenuEnabled')
        ? {
          boot_menu: {
            enabled: vm.bootMenuEnabled,
          },
        }
        : undefined,

      // NOTE: Disable cloudInit by sending "initialization: {}"
      initialization: vm.cloudInit && (
        vm.cloudInit.enabled
          ? {
            host_name: vm.cloudInit.hostName,
            authorized_ssh_keys: vm.cloudInit.sshAuthorizedKeys,
            root_password: vm.cloudInit.password,
            custom_script: vm.cloudInit.customScript,
            timezone: vm.cloudInit.timezone,
          }
          : {}
      ),

      large_icon: vm.icons && vm.icons.large && (vm.icons.large.id || (vm.icons.large.data && vm.icons.large.media_type))
        ? vm.icons.large
        : undefined,
    }
  },
}

//
//
const VmStatistics = {
  toInternal ({ statistics }: { statistics: Array<ApiVmStatisticType> }): VmStatisticsType {
    const base: VmStatisticsType = {
      memory: {},
      cpu: {},
      network: {},
      elapsedUptime: {
        datum: 0,
        unit: 'seconds',
        description: 'Elapsed VM runtime (default to 0)',
      },
      disks: {},
    }

    for (const stat: ApiVmStatisticType of statistics) {
      if (stat.name === 'elapsed.time') {
        base.elapsedUptime.datum = stat.values.value[0].datum
        base.elapsedUptime.description = stat.description
      }

      if (stat.kind !== 'gauge') continue

      // no values -> undefined, 1 value -> value.datum, >1 values -> [...values.datum]
      // ?disks.usage -> {detail...}
      let datum: any =
        stat.values &&
        stat.values.value &&
        (stat.name === 'disks.usage'
          ? stat.values.value[0].detail || null
          : stat.values.value.length === 1
            ? stat.values.value[0].datum
            : stat.values.value.map(value => value.datum))

      if (stat.name === 'disks.usage' && datum !== null) {
        datum = JSON.parse(datum)
        datum = datum.map(data => {
          data.total = convertInt(data.total)
          data.used = convertInt(data.used)
          return data
        })
      }
      const nameParts = /^(memory|cpu|network|disks)\.(.*)?$/.exec(stat.name)
      if (nameParts) {
        base[nameParts[1]][nameParts[2]] = {
          datum,
          unit: stat.unit,
          description: stat.description,
        }
      }
    }

    return base
  },
}

//
//
const Template = {
  toInternal ({ template }: { template: ApiTemplateType}): TemplateType {
    const permits = template.permissions && template.permissions.permission
      ? getUserPermits(Permissions.toInternal({ permissions: template.permissions.permission }))
      : new Set()
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
      type: template.type,

      cpu: {
        vCPUs: vCpusCount({ cpu: template.cpu }),
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
      cloudInit: CloudInit.toInternal({ vm: template }),
      bootMenuEnabled: template.bios && template.bios.boot_menu && convertBool(template.bios.boot_menu.enabled),
      permits,
    }
  },

  toApi: undefined,
}

//
//
const Pool = {
  toInternal ({ pool }: { pool: ApiPoolType}): PoolType {
    if (!pool['name']) {
      console.info('Pool.toInternal, pool received without name:', JSON.stringify(pool), pool)
    }

    return {
      id: pool['id'],
      name: pool['name'],
      description: pool['description'],
      status: 'down',
      os: {
        type: pool.vm && pool.vm.os ? pool.vm.os.type : undefined,
      },
      type: pool['type'],
      lastMessage: '',

      size: pool['size'],
      maxUserVms: pool['max_user_vms'],
      preStartedVms: pool['prestarted_vms'],

      vm: VM.toInternal({ vm: pool.vm }),
      vmsCount: 0,
    }
  },

  toApi: undefined,
}

//
//
const Snapshot = {
  toInternal ({ snapshot }: { snapshot: ApiSnapshotType }): SnapshotType {
    return {
      id: snapshot.id || '',
      description: snapshot.description,
      vm: snapshot.vm ? VM.toInternal({ vm: snapshot.vm }) : {},
      type: snapshot.snapshot_type || '',
      date: snapshot.date || Date.now(),
      status: snapshot.snapshot_status || '',
      persistMemoryState: snapshot.persist_memorystate === 'true',
      isActive: snapshot.snapshot_type === 'active',
    }
  },

  toApi ({ snapshot }: { snapshot: SnapshotType }): ApiSnapshotType {
    return {
      description: snapshot.description,
    }
  },
}

//
//
// VM -> DiskAttachments.DiskAttachment[] -> Disk
const DiskAttachment = {
  toInternal ({ attachment, disk }: { attachment?: ApiDiskAttachmentType, disk: ApiDiskType }): DiskType {
    // TODO Add nested permissions support when BZ 1639784 will be done
    return cleanUndefined({
      attachmentId: attachment && attachment['id'],
      active: attachment && convertBool(attachment['active']),
      bootable: attachment && convertBool(attachment['bootable']),
      iface: attachment && attachment['interface'],

      id: disk.id,
      name: disk['alias'],
      type: disk['storage_type'], // [ image | lun | cinder ]

      format: disk['format'], // [ cow | raw ] only for types [ images | cinder ]
      status: disk['status'], // [ illegal | locked | ok ] only for types [ images | cinder ]
      sparse: convertBool(disk.sparse),

      actualSize: convertInt(disk['actual_size']),
      provisionedSize: convertInt(disk['provisioned_size']),
      lunSize:
        disk.lun_storage &&
        disk.lun_storage.logical_units &&
        disk.lun_storage.logical_units.logical_unit &&
        disk.lun_storage.logical_units.logical_unit[0] &&
        convertInt(disk.lun_storage.logical_units.logical_unit[0].size),

      storageDomainId: // only for types [ image | cinder ]
        disk.storage_domains &&
        disk.storage_domains.storage_domain &&
        disk.storage_domains.storage_domain[0] &&
        disk.storage_domains.storage_domain[0].id,
    })
  },

  // NOTE: This will only work if disk.type == "image"
  toApi ({ disk }: { disk: DiskType }): ApiDiskAttachmentType {
    // if (disk.type !== 'image') throw Error('Only image type disks can be converted to API data')

    return {
      // disk_attachment part
      id: disk.attachmentId,
      active: disk.active,
      bootable: disk.bootable,
      interface: disk.iface,

      // disk part
      disk: {
        id: disk.id,
        alias: disk.name,

        storage_type: 'image',
        format: disk.format || (disk.sparse && disk.sparse ? 'cow' : 'raw'),
        sparse: disk.sparse,
        provisioned_size: disk.provisionedSize,

        storage_domains: disk.storageDomainId && {
          storage_domain: [
            {
              id: disk.storageDomainId,
            },
          ],
        },
      },
    }
  },
}

//
//
const DataCenter = {
  toInternal ({ dataCenter }: { dataCenter: ApiDataCenterType }): DataCenterType {
    // TODO Add nested permissions support when BZ 1639784 will be done
    return {
      id: dataCenter.id,
      name: dataCenter.name,
      status: dataCenter.status,
    }
  },

  toApi: undefined,
}

//
//
const StorageDomain = {
  toInternal ({ storageDomain }: { storageDomain: ApiStorageDomainType }): StorageDomainType {
    return {
      id: storageDomain.id,
      name: storageDomain.name,
      type: storageDomain.type,

      availableSpace: convertInt(storageDomain.available),
      usedSpace: convertInt(storageDomain.used),

      /*
       * status and data_center properties are only returned when storage domain accessed through
       * "/datacenters/{id}/storagedomains" not when accessed through "/storagedomains"
       */
      statusPerDataCenter: storageDomain.status && storageDomain.data_center
        ? { [storageDomain.data_center.id]: storageDomain.status }
        : { },
    }
  },

  toApi: undefined,
}

//
//
const CdRom = {
  toInternal ({ cdrom }: { cdrom: ApiCdRomType }): CdRomType {
    return {
      id: cdrom.id,
      fileId: cdrom.file && cdrom.file.id,
    }
  },

  toApi ({ cdrom }: { cdrom: CdRomType }): ApiCdRomType {
    return {
      id: cdrom.id,
      file: {
        id: cdrom.fileId || '', // no fileId == Eject == ''
      },
    }
  },
}

//
// (only for a Storage Domain type === 'iso')
const StorageDomainFile = {
  toInternal ({ file }: { file: ApiStorageDomainFileType }): StorageDomainFileType {
    return {
      id: file.id,
      name: file.name,
    }
  },

  toApi: undefined,
}

//
//
const Cluster = {
  toInternal ({ cluster }: { cluster: ApiClusterType }): ClusterType {
    const permits = cluster.permissions && cluster.permissions.permission
      ? getUserPermits(Permissions.toInternal({ permissions: cluster.permissions.permission }))
      : new Set()
    const c: Object = {
      id: cluster.id,
      name: cluster.name,
      dataCenterId: cluster.data_center && cluster.data_center.id,
      architecture: cluster.cpu && cluster.cpu.architecture,

      memoryPolicy: {
        overCommitPercent:
          cluster['memory_policy'] &&
          cluster['memory_policy']['over_commit'] &&
          cluster['memory_policy']['over_commit']['percent']
            ? cluster['memory_policy']['over_commit']['percent']
            : 100,
      },
      canUserUseCluster: canUserUseCluster(permits),
      permits,
    }

    if (cluster.networks && cluster.networks.network && cluster.networks.network.length > 0) {
      const networkIds = cluster.networks.network.map(network => network.id)
      c.networks = networkIds
    }

    return c
  },

  toApi: undefined,
}

//
//
const Nic = {
  toInternal ({ nic }: { nic: ApiNicType }): NicType {
    const ips =
      nic.reported_devices && nic.reported_devices.reported_device
        ? nic.reported_devices.reported_device
          .filter(device => !!device.ips && !!device.ips.ip)
          .map(device => device.ips.ip)
          .reduce((ips, ipArray) => [...ipArray, ...ips], [])
        : []

    return {
      id: nic.id,
      name: nic.name,
      mac: nic.mac.address,
      plugged: convertBool(nic.plugged),
      linked: convertBool(nic.linked),
      interface: nic.interface,
      ips,
      ipv4: ips.filter(ip => ip.version === 'v4').map(rec => rec.address),
      ipv6: ips.filter(ip => ip.version === 'v6').map(rec => rec.address),

      vnicProfile: {
        id: nic.vnic_profile ? nic.vnic_profile.id : null,
      },
    }
  },

  toApi ({ nic }: { nic: NicType }): ApiNicType {
    const res = {
      id: nic.id,
      name: nic.name,
      plugged: nic.plugged,
      linked: nic.linked,
      interface: nic.interface,
      vnic_profile: undefined,
    }
    if (nic.vnicProfile.id) {
      res.vnic_profile = {
        id: nic.vnicProfile.id,
      }
    }
    return res
  },
}

//
//
const VNicProfile = {
  toInternal ({ vnicProfile }: { vnicProfile: ApiVnicProfileType }): VnicProfileType {
    const vnicProfileInternal = {
      id: vnicProfile.id,
      name: vnicProfile.name,

      dataCenterId: vnicProfile.network.data_center.id,
      network: {
        id: vnicProfile.network.id,
        name: vnicProfile.network.name,
        dataCenterId: vnicProfile.network.data_center && vnicProfile.network.data_center.id,
      },
      canUserUseProfile: false,
      permits: new Set(),
    }

    if (vnicProfile.network.name) {
      vnicProfileInternal.network.name = vnicProfile.network.name
    }

    if (vnicProfile.permissions && vnicProfile.permissions.permission) {
      vnicProfileInternal.permits = getUserPermits(Permissions.toInternal({
        permissions: vnicProfile.permissions.permission,
      }))
      vnicProfileInternal.canUserUseProfile = canUserUseVnicProfile(vnicProfileInternal.permits)
    }

    return vnicProfileInternal
  },

  toApi: undefined,
}

//
//
const Network = {
  toInternal ({ network }: { network: ApiNetworkType }): NetworkType {
    return {
      id: network.id,
      name: network.name,
    }
  },

  toApi: undefined,
}

//
//
const Host = {
  toInternal ({ host }: { host: ApiHostType }): HostType {
    return {
      id: host.id,
      name: host.name,

      address: host.address,
      clusterId: host.cluster && host.cluster.id,
    }
  },

  toApi: undefined,
}

//
//
const OS = {
  toInternal ({ os }: { os: ApiOsType }): OsType {
    return {
      id: os.id,
      name: os.name,
      description: os.description,
      icons: {
        large: {
          id: os['large_icon'] ? os.large_icon['id'] : undefined,
        },
      },
    }
  },

  toApi: undefined,
}

//
//
const Icon = {
  toInternal ({ icon }: { icon: ApiIconType }): IconType {
    return {
      id: icon.id,
      type: icon['media_type'],
      data: icon.data,
    }
  },

  toApi: undefined,
}

//
//
const SSHKey = {
  toInternal ({ sshKey }: { sshKey: ApiSshKeyType }): SshKeyType {
    return {
      id: sshKey.id,
      key: sshKey.content,
    }
  },

  toApi: undefined,
}

//
//
const VmConsoles = {
  toInternal ({ consoles }: { consoles: ApiVmConsolesType }): Array<VmConsolesType> {
    return consoles['graphics_console'].map((c: Object): Object => {
      return {
        id: c.id,
        protocol: c.protocol,
      }
    }).sort((a: Object, b: Object): number => b.protocol.length - a.protocol.length) // Hack: VNC is shorter then SPICE
  },

  toApi: undefined,
}

//
//
const VmSessions = {
  toInternal ({ sessions }: { sessions: ApiVmSessionsType }): VmSessionsType {
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

  toApi: undefined,
}

const Permissions = {
  toInternal ({ permissions }: { permissions: Array<ApiPermissionType> }): Array<PermissionType> {
    return permissions.map(permission => ({
      name: permission.role.name,
      userId: permission.user && permission.user.id,
      groupId: permission.group && permission.group.id,
      permits: permission.role.permits ? permission.role.permits.permit.map(permit => ({ name: permit.name })) : [],
    }))
  },

  toApi: undefined,
}

//
//
const CloudInit = {
  toInternal ({ vm }: { vm: ApiCloudInitType }): CloudInitType {
    return {
      enabled: !!vm.initialization,
      hostName: (vm.initialization && vm.initialization.host_name) || '',
      sshAuthorizedKeys: (vm.initialization && vm.initialization.authorized_ssh_keys) || '',
      timezone: (vm.initialization && vm.initialization.timezone) || '',
      customScript: (vm.initialization && vm.initialization.custom_script) || '',
      password: (vm.initialization && vm.initialization.root_password) || '',
    }
  },

  toApi: undefined,
}

const Event = {
  toInternal ({ event }: { event: ApiEventType }): EventType {
    return {
      id: event.id,
      time: event.time,
      description: event.description,
      severity: event.severity,
    }
  },

  toApi: undefined,
}

//
// Export each transforms individually so they can be consumed individually
//
export {
  VM,
  Pool,
  CdRom,
  Snapshot,
  DiskAttachment,
  Template,
  StorageDomain,
  DataCenter,
  Cluster,
  Nic,
  VNicProfile,
  Network,
  Host,
  OS,
  StorageDomainFile,
  SSHKey,
  Icon,
  VmConsoles,
  VmSessions,
  CloudInit,
  Permissions,
  Event,
}
