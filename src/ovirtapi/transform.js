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
  ApiRoleType, RoleType,
  ApiUserType, UserType,
  UserOptionType,
  RemoteUserOptionsType,
  VersionType,
  ApiBooleanType,
  ApiEngineOptionType, EngineOptionType,
  EngineOptionNumberPerVersionType,
  EngineOptionMaxNumOfVmCpusPerArchType,
} from './types'

import { isWindows } from '_/helpers'
import { DEFAULT_ARCH } from '_/constants'

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

function toApiBoolean (value: any): ApiBooleanType {
  return value ? 'true' : 'false'
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

const colors = [
  '#ec7a08',
  '#f0ab00',
  '#92d400',
  '#3f9c35',
  '#007a87',
  '#00b9e4',
  '#703fec',
  '#486b00',
  '#003d44',
  '#005c73',
  '#40199a',
]

function getPoolColor (id: string): string {
  let poolColor = 0
  for (let i = 0; i < id.length; i++) {
    poolColor += id.charCodeAt(i)
  }
  return colors[poolColor % colors.length]
}

//
//
const VM = {
  toInternal ({ vm }: { vm: ApiVmType }): VmType {
    const permissions = vm.permissions && vm.permissions.permission
      ? Permissions.toInternal({ permissions: vm.permissions.permission })
      : []

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
      customCompatibilityVersion: vm.custom_compatibility_version
        ? `${vm.custom_compatibility_version.major}.${vm.custom_compatibility_version.minor}`
        : undefined,

      startTime: convertEpoch(vm['start_time']),
      stopTime: convertEpoch(vm['stop_time']),
      creationTime: convertEpoch(vm['creation_time']),
      startPaused: convertBool(vm['start_paused']),

      stateless: vm['stateless'] === 'true',

      fqdn: vm['fqdn'],

      customProperties: vm['custom_properties'] ? vm['custom_properties']['custom_property'] : [],

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

      ssoGuestAgent: vm.sso.methods && vm.sso.methods.method && vm.sso.methods.method.length > 0 && vm.sso.methods.method.findIndex(method => method.id === 'guest_agent') > -1,
      display: {
        smartcardEnabled: vm.display && vm.display.smartcard_enabled && convertBool(vm.display.smartcard_enabled),
      },
      bootMenuEnabled: vm.bios && vm.bios.boot_menu && convertBool(vm.bios.boot_menu.enabled),
      cloudInit: CloudInit.toInternal({ vm }),
      timeZone: vm.time_zone && {
        name: vm.time_zone.name,
        offset: vm.time_zone.utc_offset,
      },

      // roles are required to calculate permits and 'canUse*', therefore its done in sagas
      permissions,
      userPermits: new Set(),
      canUserChangeCd: true,
      canUserEditVm: false,
      canUserEditVmStorage: false,
      canUserManipulateSnapshots: false,

      // engine option config values that map to the VM's custom compatibility version.
      // the mapping from engine options are done in sagas. if custom compatibility version
      // is not set, the fetch saga will set `cpuOptions` to `null`. -1 values here make it
      // obvious if the fetch saga fails.
      cpuOptions: {
        maxNumOfSockets: -1,
        maxNumOfCores: -1,
        maxNumOfThreads: -1,
        maxNumOfVmCpus: -1,
      },
    }

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

      time_zone: vm.timeZone && {
        name: vm.timeZone.name,
        utc_offset: vm.timeZone.offset,
      },

      bios: vm.hasOwnProperty('bootMenuEnabled')
        ? {
          boot_menu: {
            enabled: toApiBoolean(vm.bootMenuEnabled),
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
  toInternal ({ statistics = [] }: { statistics: Array<ApiVmStatisticType> } = {}): VmStatisticsType {
    const base: VmStatisticsType = {
      memory: {},
      cpu: {},
      network: {},
      elapsedUptime: {
        firstDatum: undefined,
        datum: [ 0 ],
        unit: 'seconds',
        description: 'Elapsed VM runtime (default to 0)',
      },
      disks: {},
    }

    for (const stat: ApiVmStatisticType of statistics) {
      if (stat.name === 'elapsed.time') {
        base.elapsedUptime.datum = stat.values.value.map((val: any) => val.datum)
        base.elapsedUptime.firstDatum = base.elapsedUptime.datum[0]
        base.elapsedUptime.description = stat.description
      }

      if (stat.kind !== 'gauge') continue

      // no values -> undefined, >0 value -> [...values.datum]
      let datum: any
      if (stat.values && stat.values.value) {
        if (stat.type === 'decimal' || stat.type === 'integer') {
          datum = Array.isArray(stat.values.value)
            ? stat.values.value.map((val: any) => val.datum)
            : [stat.values.value.datum]
        }

        if (stat.type === 'string') {
          datum = Array.isArray(stat.values.value)
            ? stat.values.value.map((val: any) => val.detail)
            : [stat.values.value.detail]
        }
      }

      if (stat.name === 'disks.usage' && !!datum) {
        datum = JSON.parse(datum)
        datum = datum.map(data => {
          data.total = convertInt(data.total)
          data.used = convertInt(data.used)
          return data
        })
      }

      const firstDatum: any =
        (datum && datum.length > 0)
          ? datum[0]
          : undefined

      const nameParts = /^(memory|cpu|network|disks)\.(.*)?$/.exec(stat.name)
      if (nameParts) {
        base[nameParts[1]][nameParts[2]] = {
          firstDatum,
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
    const version = {
      name: template.version ? template.version.version_name : undefined,
      number: template.version ? template.version.version_number : undefined,
      baseTemplateId: template.version && template.version.base_template ? template.version.base_template.id : undefined,
    }

    const permissions = template.permissions && template.permissions.permission
      ? Permissions.toInternal({ permissions: template.permissions.permission })
      : []

    return cleanUndefined({
      id: template.id,
      name: template.name,
      description: template.description,
      clusterId: template.cluster ? template.cluster.id : null,
      memory: template.memory,
      type: template.type,
      customCompatibilityVersion: template.custom_compatibility_version
        ? `${template.custom_compatibility_version.major}.${template.custom_compatibility_version.minor}`
        : undefined,

      cpu: {
        arch: template.cpu ? template.cpu.architecture : undefined,
        vCPUs: vCpusCount({ cpu: template.cpu }),
        topology: {
          cores: convertInt(template.cpu.topology.cores),
          sockets: convertInt(template.cpu.topology.sockets),
          threads: convertInt(template.cpu.topology.threads),
        },
      },

      version,
      os: {
        type: template.os ? template.os.type : undefined,
      },
      cloudInit: CloudInit.toInternal({ vm: template }),
      bootMenuEnabled: template.bios && template.bios.boot_menu && convertBool(template.bios.boot_menu.enabled),
      timeZone: template.time_zone && {
        name: template.time_zone.name,
        offset: template.time_zone.utc_offset,
      },

      nics: template.nics && template.nics.nic
        ? template.nics.nic.map(
          nic => Nic.toInternal({ nic })
        )
        : undefined,

      disks: template.disk_attachments && template.disk_attachments.disk_attachment
        ? template.disk_attachments.disk_attachment.map(
          da => DiskAttachment.toInternal({ attachment: da, disk: da.disk })
        )
        : undefined,

      // roles are required to calculate permits and 'canUse*', therefore its done in sagas
      permissions,
      userPermits: new Set(),
      canUserUseTemplate: false,

      // engine option config values that map to the Templates's custom compatibility version.
      // the mapping from engine options are done in sagas. if custom compatibility version
      // is not set, the fetch saga will set `cpuOptions` to `null`. -1 values here make it
      // obvious if the fetch saga fails.
      cpuOptions: {
        maxNumOfSockets: -1,
        maxNumOfCores: -1,
        maxNumOfThreads: -1,
        maxNumOfVmCpus: -1,
      },
    })
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
      color: getPoolColor(pool['id']),
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
      persistMemoryState: convertBool(snapshot.persist_memorystate),
      isActive: snapshot.snapshot_type === 'active',
    }
  },

  toApi ({ snapshot }: { snapshot: SnapshotType }): ApiSnapshotType {
    return {
      description: snapshot.description,
      persist_memorystate: toApiBoolean(snapshot.persistMemoryState),
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
  toApi ({ disk, attachmentOnly = false }: { disk: DiskType, attachmentOnly?: boolean }): ApiDiskAttachmentType {
    // if (disk.type !== 'image') throw Error('Only image type disks can be converted to API data')

    const forApi: ApiDiskAttachmentType = {
      // disk_attachment part
      id: disk.attachmentId,
      active: toApiBoolean(disk.active),
      bootable: toApiBoolean(disk.bootable),
      interface: disk.iface,
    }

    // disk part
    if (!attachmentOnly) {
      forApi.disk = {
        id: disk.id,
        alias: disk.name,

        storage_type: 'image',
        format: disk.format || (disk.sparse && disk.sparse ? 'cow' : 'raw'),
        sparse: toApiBoolean(disk.sparse),
        provisioned_size: disk.provisionedSize,

        storage_domains: disk.storageDomainId && {
          storage_domain: [
            {
              id: disk.storageDomainId,
            },
          ],
        },
      }
    }

    return cleanUndefined(forApi)
  },
}

//
//
const DataCenter = {
  toInternal ({ dataCenter }: { dataCenter: ApiDataCenterType }): DataCenterType {
    const permissions = dataCenter.permissions && dataCenter.permissions.permission
      ? Permissions.toInternal({ permissions: dataCenter.permissions.permission })
      : []

    const storageDomains = dataCenter.storage_domains && dataCenter.storage_domains.storage_domain
      ? dataCenter.storage_domains.storage_domain.reduce((acc, storageDomain) => {
        acc[storageDomain.id] = {
          id: storageDomain.id,
          name: storageDomain.name,
          status: storageDomain.status,
          type: storageDomain.type,
        }
        return acc
      }, {})
      : {}

    return {
      id: dataCenter.id,
      name: dataCenter.name,
      version: `${dataCenter.version.major}.${dataCenter.version.minor}`,
      status: dataCenter.status,
      storageDomains,
      permissions,
    }
  },

  toApi: undefined,
}

//
//
const StorageDomain = {
  toInternal ({ storageDomain }: { storageDomain: ApiStorageDomainType }): StorageDomainType {
    const permissions = storageDomain.permissions && storageDomain.permissions.permission
      ? Permissions.toInternal({ permissions: storageDomain.permissions.permission })
      : []

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

      // roles are required to calculate permits and 'canUse*', therefore its done in sagas
      permissions,
      userPermits: new Set(),
      canUserUseDomain: false,
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
    const permissions = cluster.permissions && cluster.permissions.permission
      ? Permissions.toInternal({ permissions: cluster.permissions.permission })
      : []

    const c: Object = {
      id: cluster.id,
      name: cluster.name,
      version: `${cluster.version.major}.${cluster.version.minor}`,
      dataCenterId: cluster.data_center && cluster.data_center.id,
      architecture: cluster.cpu && cluster.cpu.architecture,
      cpuType: cluster.cpu && cluster.cpu.type,

      memoryPolicy: {
        overCommitPercent:
          cluster['memory_policy'] &&
          cluster['memory_policy']['over_commit'] &&
          cluster['memory_policy']['over_commit']['percent']
            ? cluster['memory_policy']['over_commit']['percent']
            : 100,
      },

      // roles are required to calculate permits and 'canUse*', therefore its done in sagas
      permissions,
      userPermits: new Set(),
      canUserUseCluster: false,

      // engine option config values that map to cluster compatibility version. mappings
      // are done in sagas. -1 values make it obvious if the fetch saga fails
      cpuOptions: {
        maxNumOfSockets: -1,
        maxNumOfCores: -1,
        maxNumOfThreads: -1,
        maxNumOfVmCpus: -1,
      },
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
    const { mac: { address: nicMacAddress = '' } = {} } = nic
    const ips =
      nic.reported_devices && nic.reported_devices.reported_device
        ? nic.reported_devices.reported_device
          .filter(device => !!device.ips && !!device.ips.ip && device.mac && device.mac.address === nicMacAddress)
          .map(device => device.ips.ip)
          .reduce((ips, ipArray) => [...ipArray, ...ips], [])
        : []

    return {
      id: nic.id,
      name: nic.name,
      mac: nic.mac && nic.mac.address,
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
      plugged: toApiBoolean(nic.plugged),
      linked: toApiBoolean(nic.linked),
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
    const permissions = vnicProfile.permissions && vnicProfile.permissions.permission
      ? Permissions.toInternal({ permissions: vnicProfile.permissions.permission })
      : []

    const vnicProfileInternal = {
      id: vnicProfile.id,
      name: vnicProfile.name,

      dataCenterId: vnicProfile.network.data_center.id,
      network: {
        id: vnicProfile.network.id,
        name: vnicProfile.network.name,
        dataCenterId: vnicProfile.network.data_center && vnicProfile.network.data_center.id,
      },

      // roles are required to calculate permits and 'canUse*', therefore its done in sagas
      permissions,
      userPermits: new Set(),
      canUserUseProfile: false,
    }

    if (vnicProfile.network.name) {
      vnicProfileInternal.network.name = vnicProfile.network.name
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
      architecture: os.architecture,
      icons: {
        large: {
          id: os['large_icon'] ? os.large_icon['id'] : undefined,
        },
      },
      isWindows: isWindows(os.description),
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
  toInternal ({ consoles: { graphics_console: graphicConsoles = [] } = {} }: { consoles: ApiVmConsolesType }): Array<VmConsolesType> {
    return graphicConsoles.map((c: Object): Object => {
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

//
//
const Permissions = {
  toInternal ({ permissions = [] }: { permissions: Array<ApiPermissionType> }): Array<PermissionType> {
    return permissions.map(permission => ({
      name: permission.role.name,
      userId: permission.user && permission.user.id,
      groupId: permission.group && permission.group.id,
      roleId: permission.role && permission.role.id,
      permits: permission.role.permits ? permission.role.permits.permit.map(permit => ({ name: permit.name })) : [],
    }))
  },

  toApi: undefined,
}

//
//
const Role = {
  toInternal ({ role }: { role: ApiRoleType }): RoleType {
    const permits = role.permits && role.permits.permit && Array.isArray(role.permits.permit)
      ? role.permits.permit.map(permit => ({
        id: permit.id,
        administrative: convertBool(permit.administrative),
        name: permit.name,
      }))
      : []

    return {
      id: role.id,
      administrative: convertBool(role.administrative),
      name: role.name,
      permits,
    }
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

//
//
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

const RemoteUserOptions = {
  toInternal: (options: Array<UserOptionType<string> & {name: string}> = []): RemoteUserOptionsType => {
    const vmPortalOptions: Array<[string, UserOptionType<any>]> = options
      .map(option => RemoteUserOption.toInternal(option))
      // non-vmPortal props were reduced to undefined
      // filter them out
      .filter(Boolean)

    const fromEntries = {}
    vmPortalOptions.forEach(([name, option]) => { fromEntries[name] = option })

    // pick only options supported by this version of the UI
    const {
      locale,
      refreshInterval,
      persistLocale,
      preferredConsole,
      fullScreenVnc,
      ctrlAltEndVnc,
      fullScreenSpice,
      ctrlAltEndSpice,
      smartcardSpice,
    } = fromEntries

    return {
      locale,
      refreshInterval,
      persistLocale,
      preferredConsole,
      fullScreenVnc,
      ctrlAltEndVnc,
      fullScreenSpice,
      ctrlAltEndSpice,
      smartcardSpice,
    }
  },
}

const VM_PORTAL_PREFIX = 'vmPortal.'

const RemoteUserOption = {
  canTransformToInternal: (name: string): boolean => !!name && name.startsWith(VM_PORTAL_PREFIX),
  toInternal: ({ name, content, id }: UserOptionType<string> & {name: string} = {}): ?[string, UserOptionType<any>] => {
    if (!RemoteUserOption.canTransformToInternal(name)) {
      return undefined
    }
    return [
      name.replace(VM_PORTAL_PREFIX, ''),
      {
        id,
        content: JSON.parse(content),
      }]
  },
  toApi: (name: string, option: UserOptionType<Object>): UserOptionType<string> & {name: string} => {
    return ({
      name: `${VM_PORTAL_PREFIX}${name}`,
      // double encoding - value is transferred as a string
      content: JSON.stringify(option.content),
    })
  },
}

const User = {
  toInternal ({ user: { user_name: userName, last_name: lastName, email, principal } = {} }: { user: ApiUserType }): UserType {
    return {
      userName,
      lastName,
      email,
      principal,
    }
  },

  toApi: undefined,
}

const Version = {
  toInternal ({ major = 0, minor = 0, build = 0 }: any): VersionType {
    return {
      major: Number(major),
      minor: Number(minor),
      build: Number(build),
    }
  },
}

//
//
//
const EngineOption = {
  toInternal (option: ApiEngineOptionType): EngineOptionType {
    const values = option && option.values && option.values.system_option_value
      ? option.values.system_option_value
      : []

    const engineOption: EngineOptionType = new Map()
    for (const value of values) {
      engineOption.set(value.version, value.value)
    }
    return engineOption
  },
}

const EngineOptionNumberPerVersion = {
  toInternal (values: EngineOptionType): EngineOptionNumberPerVersionType {
    const numberPerVersion: EngineOptionNumberPerVersionType = new Map()

    for (const [version, numberString] of values) {
      numberPerVersion.set(version, convertInt(numberString))
    }

    return numberPerVersion
  },
}

const EngineOptionMaxNumOfVmCpusPerArch = {
  /**
   * Transform a `MaxNumOfVmCpus` config string of the format:
   *     "{ppc=123, x86=456, s390x=789}"
   *
   * to an Object map of the structure:
   *     [arch type]: maxCount
   *
   * Cluster architecture types are slightly different than the config value.  The
   * names are mapped in the transform from the config value to the real types that
   * will be seen on the rest api.  Actual cluster architecture types can be seen
   * in the api docs:
   *     http://ovirt.github.io/ovirt-engine-api-model/master/#types/architecture
   */
  toInternal (cpusPerArchPerVersion: EngineOptionType): EngineOptionMaxNumOfVmCpusPerArchType {
    const versionToArchToCount: EngineOptionMaxNumOfVmCpusPerArchType = new Map()

    for (const [version, cpusPerArch] of cpusPerArchPerVersion) {
      const archToCount: { [string]: number} = {
        ppc64: 1,
        x86_64: 1,
        s390x: 1,
        [DEFAULT_ARCH]: 1,
      }

      const [, ppc] = cpusPerArch.match(/ppc=(\d+)/) || []
      if (ppc) {
        archToCount.ppc64 = parseInt(ppc, 10)
      }

      const [, x86] = cpusPerArch.match(/x86=(\d+)/) || []
      if (x86) {
        archToCount.x86_64 = parseInt(x86, 10)
      }

      const [, s390x] = cpusPerArch.match(/s390x=(\d+)/) || []
      if (s390x) {
        archToCount.s390x = parseInt(s390x, 10)
      }

      versionToArchToCount.set(version, archToCount)
    }

    return versionToArchToCount
  },
}

//
// Export each transforms individually so they can be consumed individually
//
export {
  convertBool,
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
  VmStatistics,
  CloudInit,
  Permissions,
  Event,
  Role,
  User,
  RemoteUserOptions,
  RemoteUserOption,
  Version,
  EngineOption,
  EngineOptionNumberPerVersion,
  EngineOptionMaxNumOfVmCpusPerArch,
}
