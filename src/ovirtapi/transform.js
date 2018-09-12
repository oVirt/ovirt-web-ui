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
} from './types'

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

function convertEpoch (epoch: number, defaultValue: ?string = undefined): ?string {
  // TODO: improve time conversion
  return epoch ? new Date(epoch).toUTCString() : defaultValue
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
    }

    return parsedVm
  },

  toApi ({ vm }: { vm: VmType }): ApiVmType {
    return {
      name: vm.name,
      description: vm.description,
      id: vm.id,
      type: vm.type,

      memory: vm.memory,
      memory_policy: {
        max: vm.memory_policy.max,
        guaranteed: vm.memory_policy.guaranteed,
      },

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

      os: vm.os && (vm.os.type || vm.os.bootDevices) ? {
        type: vm.os.type || undefined,
        boot: {
          devices: {
            device: vm.os.bootDevices.filter((item) => item !== null),
          },
        },
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
    }

    for (const stat: ApiVmStatisticType of statistics) {
      if (stat.kind !== 'gauge') continue

      // no values -> undefined, 1 value -> value.datum, >1 values -> [...values.datum]
      const datum =
        stat.values &&
        stat.values.value &&
        (stat.values.value.length === 1
          ? stat.values.value[0].datum
          : stat.values.value.map(value => value.datum))

      const nameParts = /^(memory|cpu|network)\.(.*)?$/.exec(stat.name)
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
      cloudInit: CloudInit.toInternal({ vm: template }),
      bootMenuEnabled: template.bios && template.bios.boot_menu && convertBool(template.bios.boot_menu.enabled),
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
  toInternal ({ attachment = {}, disk }: { attachment?: ApiDiskAttachmentType, disk: ApiDiskType }): DiskType {
    return {
      bootable: convertBool(attachment['bootable']),
      active: convertBool(attachment['active']),
      iface: attachment['interface'],

      id: disk.id,
      name: disk['name'], // same as `alias`
      status: disk['status'],

      actualSize: convertInt(disk['actual_size']),
      provisionedSize: convertInt(disk['provisioned_size']),
      format: disk['format'],
      storageDomainId:
        disk.storage_domains &&
        disk.storage_domains.storage_domain &&
        disk.storage_domains.storage_domain[0] &&
        disk.storage_domains.storage_domain[0].id,
    }
  },

  toApi: undefined,
}

//
//
const DataCenter = {
  toInternal ({ dataCenter }: { dataCenter: ApiDataCenterType }): DataCenterType {
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
    return {
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
    }
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
      name: nic.name,
      interface: 'virtio',
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
      network: {
        id: vnicProfile.network.id,
        name: null,
      },
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

//
//
const CloudInit = {
  toInternal ({ vm }: { vm: ApiCloudInitType }): CloudInitType {
    return {
      enabled: !!vm.initialization,
      hostName: (vm.initialization && vm.initialization.host_name) || '',
      sshAuthorizedKeys: (vm.initialization && vm.initialization.authorized_ssh_keys) || '',
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
}
