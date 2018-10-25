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
  network: { [networkSubKey: string]: StatisticValueType }
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
export type DiskType = Object

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
export type SshKeyType = Object

export type ApiVmConsolesType = Object
export type VmConsolesType = Object

export type ApiVmSessionsType = Object
export type VmSessionsType = Object

export type ApiPermissionType = {
  role: {
    name: string,
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
  groupId?: string
}

export type ApiCloudInitType = Object
export type CloudInitType = {
  enabled: boolean,
  hostName: string,
  sshAuthorizedKeys: string
}
