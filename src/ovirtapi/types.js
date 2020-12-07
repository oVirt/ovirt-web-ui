// @flow
//
// Types used in the API and the types used internal to the App.
//
export type ApiVmType = Object
export type VmType = Object

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
    value: Array<{
      datum: number,
      detail?: string
    }>
  }
}

export type StatisticValueType = {
  datum: number | Array<number>,
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
  persist_memorystate?: string
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

export type ApiDiskAttachmentType = Object
export type ApiDiskType = Object
export type DiskInterfaceType = "ide" | "sata" | "virtio" | "virtio_scsi"
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

export type ApiNicType = Object
export type NicType = {
  id: string,
  name: string,
  mac: string,
  plugged: boolean,
  linked: boolean,
  interface: 'e1000' | 'pci_passthrough' | 'rtl8139' | 'rtl8139_virtio' | 'virtio',
  ips: Array<{
    address: string,
    version: 'v4' | 'v6'
  }>,
  ipv4: Array<string>,
  ipv6: Array<string>,
  vnicProfile: {
    id: string | null
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

export type ApiVmConsolesType = Object
export type VmConsolesType = Object

export type ApiVmSessionsType = Object
export type VmSessionsType = Object

export type ApiUserType = Object

export type GlobalUserSettingsType = {|
  // merging logic assumes thee is no nested object
  updateRate: number,
  language: string,
  showNotifications?: boolean,
  notificationSnoozeDuration?: number
|}

export type UserOptionsType = {|
  global: GlobalUserSettingsType,
  ssh?: SshKeyType,
  lastTransactions: { global?: { transactionId: string } },
  consoleOptions: {[vmId: string]: { autoconnect?: boolean}},
  loadingFinished: boolean
|}

export type UserType = {
  userName: string,
  lastName: string,
  email: string,
  principal: string,
  receivedOptions?: Object
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
