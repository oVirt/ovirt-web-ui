// @flow
//
// Types used in the API and the types used internal to the App.
//
export type ApiVmType = Object
export type VmType = Object

export type ApiBooleanType = "true" | "false"

export type ApiStatisticKindType = "counter" | "gauge"
export type ApiStatisticTypeType = "decimal" | "integer" | "string"
export type ApiStatisticUnitType = "bytes" | "bits_per_second" | "bytes_per_second" | "count_per_second" | "seconds" | "percent" | "none"
export type ApiVmStatisticType = {
  id: string,
  name: string,
  description: string,
  kind: ApiStatisticKindType,
  type: ApiStatisticTypeType,
  unit: ApiStatisticUnitType,
  values: {
    value: Array<{ datum: number} | { detail: string }>
  }
}

export type StatisticValueType = {
  firstDatum: number | string | Object | void,
  datum: Array<number | string | Object>,
  unit: ApiStatisticUnitType,
  description: string
}
export type VmStatisticsType = {
  memory: { [memorySubKey: string]: StatisticValueType },
  cpu: { [cpuSubKey: string]: StatisticValueType },
  network: { [networkSubKey: string]: StatisticValueType },
  elapsedUptime: StatisticValueType,
  disks: { [disksSubKey: string]: StatisticValueType }
}

export type ApiTemplateType = Object
export type TemplateType = Object

export type ApiPoolType = Object
export type PoolType = Object

export type ApiSnapshotType = {
  id?: string,
  description: string,
  vm?: ApiVmType,
  snapshot_type?: string,
  date?: number,
  snapshot_status?: string,
  persist_memorystate?: ApiBooleanType
}
export type SnapshotType = {
  id: string,
  description: string,
  vm: VmType | {},
  type: string,
  date: number,
  status: string,
  persistMemoryState: boolean,
  isActive: boolean
}

export type DiskInterfaceType = "ide" | "sata" | "virtio" | "virtio_scsi"

// http://ovirt.github.io/ovirt-engine-api-model/4.4/#types/disk_attachment
export type ApiDiskAttachmentType = {
  active: ApiBooleanType,
  bootable: ApiBooleanType,
  disk?: Object,
  href?: string,
  comment?: string,
  description?: string,
  id?: string,
  logical_name?: string,
  pass_discard?: ApiBooleanType,
  read_only?: ApiBooleanType,
  uses_scsi_reservation?: ApiBooleanType,
  template?: Object,
  vm?: Object,
  interface?: DiskInterfaceType
}
export type ApiDiskType = Object
export type DiskTypeType = "image" | "cinder" | "lun"
export type DiskType = {
  // attachment part
  attachmentId?: string,
  active?: boolean,
  bootable?: boolean,
  iface?: DiskInterfaceType,

  // disk part
  id?: string,
  name: string, // aka alias
  status?: "illegal" | "locked" | "ok", // for type = [ "image" | "cinder" ]
  type: DiskTypeType,

  // disk parts for type = "image"
  format?: "cow" | "raw", // if sparse then "cow" else "raw"
  sparse?: boolean,
  actualSize?: number,
  provisionedSize?: number,
  storageDomainId?: string,

  // disk parts for type = "lun"
  lunSize?: number
}

export type ApiDataCenterType = Object
export type DataCenterType = Object

export type ApiStorageDomainType = Object
export type StorageDomainType = Object

export type ApiCdRomType = {
  id: string,
  file?: {
    id: string
  }
}
export type CdRomType = {
  id: string,
  fileId?: string
}

export type ApiStorageDomainFileType = Object
export type StorageDomainFileType = Object

export type ApiClusterType = Object
export type ClusterType = Object

type NicInterfaceType = 'e1000' | 'pci_passthrough' | 'rtl8139' | 'rtl8139_virtio' | 'virtio'

type IpType = {
  address: string,
  version: 'v4' | 'v6'
}

export type ApiNicType = {
  reported_devices?: {
    reported_device: Array<{
      mac: {
        address: string
      },
      ips: {
        ip: Array<IpType>
      }
    }>
  },
  id: string,
  name: string,
  mac?: Object,
  plugged: ApiBooleanType,
  linked: ApiBooleanType,
  interface: NicInterfaceType,
  vnic_profile?: {
    id: string | null | typeof undefined
  }
}

export type ReportedDevicesType = {
  description: string,
  href: string,
  id: string,
  ips?: { ip: Array<IpType> },
  mac: { address: string },
  name: string,
  type: string,
  vm: {
    href: string,
    id: string
  }
}

export type NicType = {
  id: string,
  name: string,
  mac?: string,
  plugged: boolean,
  linked: boolean,
  interface: NicInterfaceType,
  ips: Array<{
    address: string,
    version: 'v4' | 'v6'
  }>,
  ipv4: Array<string>,
  ipv6: Array<string>,
  vnicProfile: {
    id: string | null | typeof undefined
  }
}

export type ApiVnicProfileType = Object
export type VnicProfileType = Object

export type ApiNetworkType = Object
export type NetworkType = Object

export type ApiHostType = Object
export type HostType = Object

export type ApiOsType = Object
export type OsType = Object

export type ApiIconType = Object
export type IconType = Object

export type ApiSshKeyType = Object
export type SshKeyType = {
  key: string,
  id: string
}
export type UserOptionType<T> = {
  id?: string,
  content: T
}

export type ApiVmConsolesType = Object
export type VmConsolesType = Object

export type ApiVmSessionsType = Object
export type VmSessionsType = Object

export type ApiUserType = Object

export type GlobalUserSettingsType = {|
  refreshInterval: number,
  language: string,
  showNotifications?: boolean,
  notificationSnoozeDuration?: number
|}

export type RemoteUserOptionsType = {|
  locale?: UserOptionType<string>,
  refreshInterval?: UserOptionType<number>,
  persistLocale?: UserOptionType<boolean>,
  preferredConsole?: UserOptionType<string>,
  fullScreenVnc?: UserOptionType<boolean>,
  ctrlAltEndVnc?: UserOptionType<boolean>,
  fullScreenSpice?: UserOptionType<boolean>,
  ctrlAltEndSpice?: UserOptionType<boolean>,
  smartcardSpice?: UserOptionType<boolean>
|}

export type UserOptionsType = {|
  localOptions: {
    showNotifications?: boolean,
    notificationSnoozeDuration?: number
  },
  remoteOptions: RemoteUserOptionsType,
  ssh?: SshKeyType,
  lastTransactions: { global?: { transactionId: string } },
  consoleOptions: {[vmId: string]: { autoconnect?: boolean}}
|}

export type UserType = {
  userName: string,
  lastName: string,
  email: string,
  principal: string
}

export type ApiPermissionType = {
  role: {
    id: string,
    name: string,
    permits: {
      permit: Array<{
        name: string
      }>
    }
  },
  user?: {
    id: string
  },
  group?: {
    id: string
  }
}
export type PermissionType = {
  name: string,
  userId?: string,
  groupId?: string,
  roleId?: string,
  permits: Array<{
    name: string
  }>
}

export type ApiRoleType = Object
export type RoleType = {
  id: string,
  administrative: boolean,
  name: string,
  permits: Array<{
    id: string,
    administrative: boolean,
    name: string
  }>
}

export type ApiCloudInitType = Object
export type CloudInitType = {
  enabled: boolean,
  hostName: string,
  sshAuthorizedKeys: string,
  timezone: string,
  customScript: string
}

export type ApiEventType = Object
export type EventType = {
  id: string,
  time: number,
  description: string,
  severity: string
}

export type VersionType = {|
  major: number,
  minor: number,
  build: number
|}

export type ApiEngineOptionType = {
  name: string,
  id: string,
  values: {
    system_option_value: Array<{
      version: string,
      value: string
    }>
  }
}
export type EngineOptionType = Map<string, string>
export type EngineOptionNumberPerVersionType = Map<string, number>
export type EngineOptionMaxNumOfVmCpusPerArchType = Map<string, { [string]: number }>
