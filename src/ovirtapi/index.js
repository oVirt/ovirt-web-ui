// @flow
import type {
  CdRomType,
  DiskType,
  NicType,
  SnapshotType,
  VmType, ApiVmType,
} from './types'

import logger from '../logger'
import Selectors from '../selectors'
import AppConfiguration from '../config'

import {
  addHttpListener as transportAddHttpListener,
  assertLogin,
  httpGet,
  httpPost,
  httpPut,
  httpDelete,
} from './transport'

import * as Transforms from './transform'

type VmIdType = { vmId: string }
type PoolIdType = { poolId: string }

const zeroUUID: string = '00000000-0000-0000-0000-000000000000'

const OvirtApi = {
  addHttpListener: transportAddHttpListener,

  //
  //
  // ---- Data transform functions (API -> internal, internal -> API)
  //
  //
  vmToInternal ({ vm, getSubResources = false }: { vm: ApiVmType, getSubResources: boolean }): VmType {
    return Transforms.VM.toInternal({ vm, includeSubResources: getSubResources })
  },

  internalVmToOvirt: Transforms.VM.toApi,

  poolToInternal: Transforms.Pool.toInternal,

  diskToInternal: Transforms.DiskAttachment.toInternal,

  templateToInternal: Transforms.Template.toInternal,

  storageDomainToInternal: Transforms.StorageDomain.toInternal,

  dataCenterToInternal: Transforms.DataCenter.toInternal,

  clusterToInternal: Transforms.Cluster.toInternal,

  nicToInternal: Transforms.Nic.toInternal,
  internalNicToOvirt: Transforms.Nic.toApi,

  vnicProfileToInternal: Transforms.VNicProfile.toInternal,

  networkToInternal: Transforms.Network.toInternal,

  hostToInternal: Transforms.Host.toInternal,

  OSToInternal: Transforms.OS.toInternal,

  fileToInternal: Transforms.StorageDomainFile.toInternal,

  sessionsToInternal: Transforms.VmSessions.toInternal,

  iconToInternal: Transforms.Icon.toInternal,

  cdRomToInternal: Transforms.CdRom.toInternal,
  internalCdRomToOvirt: Transforms.CdRom.toApi,

  SSHKeyToInternal: Transforms.SSHKey.toInternal,

  consolesToInternal: Transforms.VmConsoles.toInternal,

  snapshotToInternal: Transforms.Snapshot.toInternal,
  internalSnapshotToOvirt: Transforms.Snapshot.toApi,

  permissionsToInternal: Transforms.Permissions.toInternal,

  //
  //
  // ---- API interaction functions
  //
  //
  getOvirtApiMeta (): Promise<Object> {
    assertLogin({ methodName: 'getOvirtApiMeta' })
    const url = `${AppConfiguration.applicationContext}/api/`
    return httpGet({ url })
  },
  getVm ({ vmId, additional }: { vmId: string, additional: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getVm' })
    let url = `${AppConfiguration.applicationContext}/api/vms/${vmId}`
    if (additional && additional.length > 0) {
      url += `?follow=${additional.join(',')}`
    }
    return httpGet({ url })
  },
  getVmsByPage ({ page, additional }: { page: number, additional: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getVmsByPage' })
    let url = `${AppConfiguration.applicationContext}/api/vms/;max=${AppConfiguration.pageLimit}?search=SORTBY NAME ASC page ${page}`
    if (additional && additional.length > 0) {
      url += `&follow=${additional.join(',')}`
    }
    return httpGet({ url })
  },
  getVmsByCount ({ count, additional }: { count: number, additional: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getVmsByCount' })
    let url = `${AppConfiguration.applicationContext}/api/vms/;max=${count}?search=SORTBY NAME ASC`
    if (additional && additional.length > 0) {
      url += `&follow=${additional.join(',')}`
    }
    return httpGet({ url })
  },
  shutdown ({ vmId, force }: { vmId: string, force: boolean }): Promise<Object> {
    assertLogin({ methodName: 'shutdown' })
    let restMethod = 'shutdown'
    if (force) {
      restMethod = 'stop'
    }
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/${restMethod}`,
      input: '{}',
    })
  },
  remove ({ vmId, preserveDisks }: { vmId: string, preserveDisks: boolean }): Promise<Object> {
    assertLogin({ methodName: 'remove' })
    let url = `${AppConfiguration.applicationContext}/api/vms/${vmId}`
    if (preserveDisks) {
      url = url + ';detach_only=true'
    }
    return httpDelete({
      url,
      custHeaders: {
        'Accept': 'application/json',
      },
    })
  },
  getAllTemplates (): Promise<Object> {
    assertLogin({ methodName: 'getAllTemplates' })
    const url = `${AppConfiguration.applicationContext}/api/templates`
    return httpGet({ url })
  },
  getAllDataCenters ({ additional }: { additional: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getAllDataCenters' })
    const url = `${AppConfiguration.applicationContext}/api/datacenters` +
      (additional && additional.length > 0 ? `?follow=${additional.join(',')}` : '')
    return httpGet({ url })
  },
  getAllClusters ({ additional }: { additional: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getAllClusters' })

    let follow = 'networks'
    if (additional && additional.length > 0) {
      if (!additional.includes('networks')) {
        additional.push('networks')
      }
      follow = additional.join(',')
    }

    const url = `${AppConfiguration.applicationContext}/api/clusters?follow=${follow}`
    return httpGet({ url })
  },
  getClusterPermissions ({ id }: { id: string }): Promise<Object> {
    assertLogin({ methodName: 'getClusterPermissions' })
    const url = `${AppConfiguration.applicationContext}/api/clusters/${id}/permissions?follow=role.permits`
    return httpGet({ url, custHeaders: { Filter: true } })
  },
  getVnicProfilePermissions ({ id }: { id: string }): Promise<Object> {
    assertLogin({ methodName: 'getVnicProfilePermissions' })
    const url = `${AppConfiguration.applicationContext}/api/vnicprofiles/${id}/permissions?follow=role.permits`
    return httpGet({ url, custHeaders: { Filter: true } })
  },
  getVmPermissions ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'getClusterPermissions' })
    const url = `${AppConfiguration.applicationContext}/api/vms/${vmId}/permissions?follow=role`
    return httpGet({ url, custHeaders: { Filter: true } })
  },
  getAllHosts (): Promise<Object> {
    assertLogin({ methodName: 'getAllHosts' })
    const url = `${AppConfiguration.applicationContext}/api/hosts`
    return httpGet({ url })
  },
  getAllOperatingSystems (): Promise<Object> {
    assertLogin({ methodName: 'getAllOperatingSystems' })
    const url = `${AppConfiguration.applicationContext}/api/operatingsystems`
    return httpGet({ url })
  },

  addNewVm ({ vm, transformInput = true }: { vm: VmType | Object, transformInput: boolean }): Promise<Object> {
    assertLogin({ methodName: 'addNewVm' })
    const input = JSON.stringify(transformInput ? OvirtApi.internalVmToOvirt({ vm }) : vm)
    logger.log(`OvirtApi.addNewVm(): ${input}`)

    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms`,
      input,
    })
  },
  editVm ({ vm, nextRun = false, transformInput = true }: { vm: VmType | Object, nextRun: boolean, transformInput: boolean}): Promise<Object> {
    assertLogin({ methodName: 'editVm' })
    const input = JSON.stringify(transformInput ? OvirtApi.internalVmToOvirt({ vm }) : vm)
    logger.log(`OvirtApi.editVm(): ${input}`, 'nextRun?', nextRun)

    const suffix = nextRun ? '?next_run=true' : ''

    return httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vm.id}${suffix}`,
      input,
    })
  },

  start ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'start' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/start`,
      input: '{}' })
  },
  suspend ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'suspend' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/suspend`,
      input: '{}',
    })
  },
  restart ({ vmId }: VmIdType): Promise<Object> { // 'force' is not exposed by oVirt API
    assertLogin({ methodName: 'restart' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/reboot`,
      input: '{}',
    })
  },
  startPool ({ poolId }: PoolIdType): Promise<Object> {
    assertLogin({ methodName: 'startPool' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vmpools/${poolId}/allocatevm`,
      input: '<action />',
      contentType: 'application/xml',
    })
  },
  addNewSnapshot ({ vmId, snapshot }: { vmId: string, snapshot: SnapshotType }): Promise<Object> {
    assertLogin({ methodName: 'addNewSnapshot' })
    const input = JSON.stringify(OvirtApi.internalSnapshotToOvirt({ snapshot }))
    logger.log(`OvirtApi.addNewSnapshot(): ${input}`)
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/snapshots`,
      input,
    })
  },
  deleteSnapshot ({ snapshotId, vmId }: { snapshotId: string, vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'deleteSnapshot' })
    return httpDelete({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/snapshots/${snapshotId}?async=true`,
    })
  },
  restoreSnapshot ({ snapshotId, vmId }: { snapshotId: string, vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'restoreSnapshot' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/snapshots/${snapshotId}/restore`,
      input: '<action />',
      contentType: 'application/xml',
    })
  },
  snapshotDisks ({ vmId, snapshotId }: { vmId: string, snapshotId: string }): Promise<Object> {
    assertLogin({ methodName: 'snapshotDisks' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/snapshots/${snapshotId}/disks` })
  },
  snapshotNics ({ vmId, snapshotId }: { vmId: string, snapshotId: string }): Promise<Object> {
    assertLogin({ methodName: 'snapshotNics' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/snapshots/${snapshotId}/nics` })
  },
  snapshot ({ vmId, snapshotId }: { vmId: string, snapshotId: string }): Promise<Object> {
    assertLogin({ methodName: 'snapshot' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/snapshots/${snapshotId}` })
  },
  snapshots ({ vmId }: { vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'snapshots' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/snapshots` })
  },
  groups ({ userId }: { userId: string }): Promise<Object> {
    assertLogin({ methodName: 'groups' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/users/${userId}/groups` })
  },
  icon ({ id }: { id: string }): Promise<Object> {
    assertLogin({ methodName: 'icon' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/icons/${id}` })
  },

  diskattachment ({ vmId, attachmentId }: { vmId: string, attachmentId: string}): Promise<Object> {
    assertLogin({ methodName: 'diskattachment' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/diskattachments/${attachmentId}?follow=disk` })
  },
  diskattachments ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'diskattachments' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/diskattachments` })
  },
  disk ({ diskId }: { diskId: string }): Promise<Object> {
    assertLogin({ methodName: 'disk' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/disks/${diskId}` })
  },

  consoles ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'consoles' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles` })
  },
  console ({ vmId, consoleId }: { vmId: string, consoleId: string }): Promise<Object> {
    assertLogin({ methodName: 'console' })
    return httpGet({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles/${consoleId}`,
      custHeaders: { Accept: 'application/x-virt-viewer', Filter: Selectors.getFilter() } })
  },
  vmLogon ({ vmId }: { vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'vmLogon' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/logon`,
      input: JSON.stringify({}),
    })
  },
  checkFilter (): Promise<Object> {
    assertLogin({ methodName: 'checkFilter' })
    return httpGet({
      url: `${AppConfiguration.applicationContext}/api/permissions`,
      custHeaders: {
        Filter: false,
        Accept: 'application/json',
      },
    })
  },

  getPoolsByPage ({ page }: { page: number }): Promise<Object> {
    assertLogin({ methodName: 'getPoolsByPage' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools/;max=${AppConfiguration.pageLimit}?search=SORTBY NAME ASC page ${page}`
    return httpGet({ url })
  },
  getPoolsByCount ({ count }: { count: number }): Promise<Object> {
    assertLogin({ methodName: 'getPoolsByCount' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools/;max=${count}`
    return httpGet({ url })
  },
  getPool ({ poolId }: PoolIdType): Promise<Object> {
    assertLogin({ methodName: 'getPool' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools/${poolId}`
    return httpGet({ url })
  },

  sessions ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'sessions' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/sessions` })
  },

  getStorages (): Promise<Object> {
    assertLogin({ methodName: 'getStorages' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/storagedomains` })
  },
  getStorageFiles ({ storageId }: { storageId: string }): Promise<Object> {
    assertLogin({ methodName: 'getStorageFiles' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/storagedomains/${storageId}/files` })
  },
  getIsoImages (): Promise<Object> {
    assertLogin({ methodName: 'getIsoImages' })
    const search = 'disk_type=image and disk_content_type=iso'
    return httpGet({
      url: `${AppConfiguration.applicationContext}/api/disks?search=${encodeURIComponent(search)}`,
    })
  },

  getCdRom ({ vmId, current = true }: { vmId: string, current?: boolean }): Promise<Object> {
    assertLogin({ methodName: 'getCdRom' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/cdroms/${zeroUUID}?current=${current ? 'true' : 'false'}` })
  },
  changeCdRom ({ cdrom, vmId, current = true }: { cdrom: CdRomType, vmId: string, current?: boolean }): Promise<Object> {
    assertLogin({ methodName: 'changeCdRom' })
    const input = JSON.stringify(OvirtApi.internalCdRomToOvirt({ cdrom }))
    logger.log(`OvirtApi.changeCdRom(): ${input}`)
    return httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/cdroms/${zeroUUID}?current=${current ? 'true' : 'false'}`,
      input,
    })
  },

  addNicToVm ({ nic, vmId }: { nic: NicType, vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'addNicToVm' })
    const input = JSON.stringify(OvirtApi.internalNicToOvirt({ nic }))
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/nics`,
      input,
    })
  },
  deleteNicFromVm ({ nicId, vmId }: { nicId: string, vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'deleteNicFromVm' })
    return httpDelete({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/nics/${nicId}`,
    })
  },
  editNicInVm ({ nic, vmId }: { nic: NicType, vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'editNicInVm' })
    const input = JSON.stringify(OvirtApi.internalNicToOvirt({ nic }))
    return httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/nics/${nic.id}`,
      input,
    })
  },

  getUSBFilter (): Promise<Object> {
    assertLogin({ methodName: 'getUSBFilter' })
    return httpGet({
      url: `${AppConfiguration.applicationContext}/services/files/usbfilter.txt`,
      custHeaders: {
        'Accept': 'text/plain',
      },
    })
  },

  // async operation
  removeDisk (diskId: string): Promise<Object> {
    assertLogin({ methodName: 'removeDisk' })
    const url = `${AppConfiguration.applicationContext}/api/disks/${diskId}?async=true`
    return httpDelete({ url })
  },

  // async operation
  addDiskAttachment ({ vmId, disk }: { vmId: string, disk: DiskType }): Promise<Object> {
    assertLogin({ methodName: 'addDiskAttachment' })

    const payload = Transforms.DiskAttachment.toApi({ disk })
    const input = JSON.stringify(payload)

    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/diskattachments`,
      input,
    })
  },

  // disk update is async
  // http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk/methods/update
  updateDiskAttachment ({ vmId, disk }: { vmId: string, disk: DiskType }): Promise<Object> {
    assertLogin({ methodName: 'updateDiskAttachment' })

    const attachmentId = disk.attachmentId
    if (!attachmentId) {
      throw new Error('DiskType.attachmentId is required to update the disk')
    }

    const payload = Transforms.DiskAttachment.toApi({ disk })
    const input = JSON.stringify(payload)

    return httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/diskattachments/${attachmentId}`,
      input,
    })
  },

  saveSSHKey ({ key, userId, sshId }: { key: string, userId: string, sshId: ?string }): Promise<Object> {
    assertLogin({ methodName: 'saveSSHKey' })
    const input = JSON.stringify({ content: key })
    if (sshId !== undefined && sshId !== null) {
      return httpPut({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys/${sshId}`,
        input,
      })
    } else {
      return httpPost({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys`,
        input,
      })
    }
  },
  getSSHKey ({ userId }: { userId: string }): Promise<Object> {
    assertLogin({ methodName: 'getSSHKey' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys` })
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

  getAllVnicProfiles (): Promise<Object> {
    assertLogin({ methodName: 'getVnicProfiles' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vnicprofiles?follow=network,permissions.role.permits` })
  },

  getVmsNic ({ vmId }: { vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'getVmsNic' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/nics` })
  },
  getAllNetworks (): Promise<Object> {
    assertLogin({ methodName: 'getNetworks' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/networks` })
  },
}

/**
 * @param {string} optionName
 * @param {'general' | '4.2' | '4.1' | '4.0'} version
 * @return {Promise.<?string>} promise of option value if options exists, promise of null otherwise.
 */
function getOptionWithoutDefault (optionName: string, version: string): Promise<?string> {
  assertLogin({ methodName: 'getOption' })
  return httpGet({
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
          logger.log(`Response to getting option '${optionName}' has unexpected format:`, response)
        }
        throw error
      }
      if (result === undefined) {
        logger.log(`Config option '${optionName}' was not found for version '${version}'.`)
        return null
      }
      return result
    }, error => {
      if (error.status === 404) {
        logger.log(`Config option '${optionName}' doesn't exist in any version.`)
        return null
      }
      throw error
    })
}

export default OvirtApi
