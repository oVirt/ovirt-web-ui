// @flow
import type {
  CdRomType,
  DiskType,
  NicType,
  SnapshotType,
  VmType,
} from './types'

import Selectors from '../selectors'
import AppConfiguration from '../config'

import {
  addHttpListener as transportAddHttpListener,
  updateLocale as transportUpdateLocale,
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
  updateLocale: transportUpdateLocale,

  //
  //
  // ---- Data transform functions (API -> internal, internal -> API)
  //
  //
  poolToInternal: Transforms.Pool.toInternal,

  diskToInternal: Transforms.DiskAttachment.toInternal,

  nicToInternal: Transforms.Nic.toInternal,

  sessionsToInternal: Transforms.VmSessions.toInternal,

  iconToInternal: Transforms.Icon.toInternal,

  cdRomToInternal: Transforms.CdRom.toInternal,

  SSHKeyToInternal: Transforms.SSHKey.toInternal,

  consolesToInternal: Transforms.VmConsoles.toInternal,

  snapshotToInternal: Transforms.Snapshot.toInternal,

  permissionsToInternal: Transforms.Permissions.toInternal,

  eventToInternal: Transforms.Event.toInternal,

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

  icon ({ id }: { id: string }): Promise<Object> {
    assertLogin({ methodName: 'icon' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/icons/${id}` })
  },

  user ({ userId }: { userId: string }): Promise<Object> {
    assertLogin({ methodName: 'user' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/users/${userId}` })
  },
  userDomainGroups ({ userId }: { userId: string }): Promise<Object> {
    assertLogin({ methodName: 'userDomainGroups' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/users/${userId}/groups` })
  },
  groups (): Promise<Object> {
    assertLogin({ methodName: 'groups' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/groups` })
  },

  getRoles (): Promise<Object> {
    assertLogin({ methodName: 'getRoles' })
    const url = `${AppConfiguration.applicationContext}/api/roles?follow=permits`
    return httpGet({ url })
  },

  getAllClusters (): Promise<Object> {
    assertLogin({ methodName: 'getAllClusters' })
    const url = `${AppConfiguration.applicationContext}/api/clusters?follow=networks,permissions`
    return httpGet({ url })
  },
  getAllDataCenters ({ additional }: { additional: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getAllDataCenters' })
    const url = `${AppConfiguration.applicationContext}/api/datacenters` +
      (additional && additional.length > 0 ? `?follow=${additional.join(',')}` : '')
    return httpGet({ url })
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
  getAllTemplates (): Promise<Object> {
    assertLogin({ methodName: 'getAllTemplates' })
    const url = `${AppConfiguration.applicationContext}/api/templates?follow=nics,disk_attachments.disk,permissions`
    return httpGet({ url })
  },

  // TODO: Convert to use frontend based role to permission mapping
  getDiskPermissions ({ id }: { id: string }): Promise<Object> {
    assertLogin({ methodName: 'getDiskPermissions' })
    const url = `${AppConfiguration.applicationContext}/api/disks/${id}/permissions?follow=role.permits`
    return httpGet({ url, custHeaders: { Filter: true } })
  },
  // TODO: Convert to use frontend based role to permission mapping
  getVmPermissions ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'getVmPermissions' })
    const url = `${AppConfiguration.applicationContext}/api/vms/${vmId}/permissions?follow=role.permits`
    return httpGet({ url, custHeaders: { Filter: true } })
  },

  // ---- VM fetching
  getVm ({ vmId, additional }: { vmId: string, additional: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getVm' })
    let url = `${AppConfiguration.applicationContext}/api/vms/${vmId}`
    if (additional && additional.length > 0) {
      url += `?follow=${additional.join(',')}`
      url += '&current' // performance optimization - retrieve graphic consoles from vm_dynamic
    }
    return httpGet({ url })
  },
  getVms ({ count, page, additional }: { count?: number, page?: number, additional?: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getAllVms' })
    const max = count ? `;max=${count}` : ''
    const params =
      [
        'detail=current_graphics_consoles',
        'current', // for backward compatibility only (before 4.4.7)
        page ? 'search=' + encodeURIComponent(`SORTBY NAME ASC page ${page}`) : '',
        additional && additional.length > 0 ? 'follow=' + encodeURIComponent(`${additional.join(',')}`) : '',
      ]
        .filter(p => !!p)
        .join('&')

    const url = `${AppConfiguration.applicationContext}/api/vms${max}${params ? '?' : ''}${params}`
    return httpGet({ url })
  },

  // ---- VM actions
  addNewVm ({
    vm,
    transformInput = true,
    clone = false,
    clonePermissions,
  }: {
    vm: VmType | Object,
    transformInput: boolean,
    clone: boolean,
    clonePermissions?: boolean
  }): Promise<Object> {
    assertLogin({ methodName: 'addNewVm' })
    const input = JSON.stringify(transformInput ? Transforms.VM.toApi({ vm }) : vm)
    console.log(`OvirtApi.addNewVm(): ${input}`)

    return httpPost({
      url:
        `${AppConfiguration.applicationContext}/api/vms` +
        `?clone=${clone ? 'true' : 'false'}` +
        (clonePermissions === undefined ? '' : `&clone_permissions=${clonePermissions ? 'true' : 'false'}`),
      input,
    })
  },
  editVm ({
    vm, nextRun = false, transformInput = true,
  }: {
    vm: VmType | Object, nextRun: boolean, transformInput: boolean
  }): Promise<Object> {
    assertLogin({ methodName: 'editVm' })
    const input = JSON.stringify(transformInput ? Transforms.VM.toApi({ vm }) : vm)
    console.log(`OvirtApi.editVm(): ${input}`, 'nextRun?', nextRun)

    const suffix = nextRun ? '?next_run=true' : ''

    return httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vm.id}${suffix}`,
      input,
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

  // ---- Snapshots
  addNewSnapshot ({ vmId, snapshot }: { vmId: string, snapshot: SnapshotType }): Promise<Object> {
    assertLogin({ methodName: 'addNewSnapshot' })
    const input = JSON.stringify(Transforms.Snapshot.toApi({ snapshot }))
    console.log(`OvirtApi.addNewSnapshot(): ${input}`)
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

  console ({ vmId, consoleId }: { vmId: string, consoleId: string }): Promise<Object> {
    assertLogin({ methodName: 'console' })
    return httpGet({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles/${consoleId}`,
      custHeaders: { Accept: 'application/x-virt-viewer', Filter: Selectors.getFilter() } })
  },

  consoleProxyTicket ({ vmId, consoleId }: { vmId: string, consoleId: string }): Promise<Object> {
    assertLogin({ methodName: 'consoleProxyTicket' })
    const input = JSON.stringify({ async: false })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles/${consoleId}/proxyticket`,
      input,
    })
  },

  consoleTicket ({ vmId, consoleId }: {vmId: string, consoleId: string}): Promise<Object> {
    assertLogin({ methodName: 'consoleTicket' })
    const input = JSON.stringify({ async: false })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles/${consoleId}/ticket`,
      input,
    })
  },

  vmLogon ({ vmId }: { vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'vmLogon' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/logon`,
      input: JSON.stringify({}),
    })
  },

  events (): Promise<Object> {
    assertLogin({ methodName: 'events' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/events?search=severity%3Derror` })
  },
  dismissEvent ({ eventId }: { eventId: string }): Promise<Object> {
    assertLogin({ methodName: 'dismissEvent' })
    return httpDelete({ url: `${AppConfiguration.applicationContext}/api/events/${eventId}` })
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

  getPool ({ poolId }: PoolIdType): Promise<Object> {
    assertLogin({ methodName: 'getPool' })
    const url = `${AppConfiguration.applicationContext}/api/vmpools/${poolId}`
    return httpGet({ url })
  },
  getPools ({ count, page, additional }: { count?: number, page?: number, additional?: Array<string> }): Promise<Object> {
    assertLogin({ methodName: 'getPools' })
    const max = count ? `;max=${count}` : ''
    const params =
      [
        page ? 'search=' + encodeURIComponent(`SORTBY NAME ASC page ${page}`) : '',
        additional && additional.length > 0 ? 'follow=' + encodeURIComponent(`${additional.join(',')}`) : '',
      ]
        .filter(p => !!p)
        .join('&')

    const url = `${AppConfiguration.applicationContext}/api/vmpools${max}${params ? '?' : ''}${params}`
    return httpGet({ url })
  },
  startPool ({ poolId }: PoolIdType): Promise<Object> {
    assertLogin({ methodName: 'startPool' })
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/vmpools/${poolId}/allocatevm`,
      input: '<action />',
      contentType: 'application/xml',
    })
  },

  sessions ({ vmId }: VmIdType): Promise<Object> {
    assertLogin({ methodName: 'sessions' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/sessions` })
  },

  getStorages (): Promise<Object> {
    assertLogin({ methodName: 'getStorages' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/storagedomains?follow=permissions` })
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
    const input = JSON.stringify(Transforms.CdRom.toApi({ cdrom }))
    console.log(`OvirtApi.changeCdRom(): ${input}`)
    return httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/cdroms/${zeroUUID}?current=${current ? 'true' : 'false'}`,
      input,
    })
  },

  addNicToVm ({ nic, vmId }: { nic: NicType, vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'addNicToVm' })
    const input = JSON.stringify(Transforms.Nic.toApi({ nic }))
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
    const input = JSON.stringify(Transforms.Nic.toApi({ nic }))
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
  // http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachment/methods/update
  updateDiskAttachment ({ vmId, disk, attachmentOnly = false }: { vmId: string, disk: DiskType, attachmentOnly: boolean }): Promise<Object> {
    assertLogin({ methodName: 'updateDiskAttachment' })

    const attachmentId = disk.attachmentId
    if (!attachmentId) {
      throw new Error('DiskType.attachmentId is required to update the disk')
    }

    const payload = Transforms.DiskAttachment.toApi({ disk, attachmentOnly })
    const input = JSON.stringify(payload)

    return httpPut({
      url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/diskattachments/${attachmentId}`,
      input,
    })
  },

  saveSSHKey ({ key, userId, sshId }: { key: string, userId: string, sshId: ?string }): Promise<Object> {
    assertLogin({ methodName: 'saveSSHKey' })
    const input = JSON.stringify({ content: key })
    if (sshId && key) {
      /**
       * Update existing key.
       * Expected result: { user: <> , content: <>, id: <>, href: <> }
       */
      return httpPut({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys/${sshId}`,
        input,
      })
    } else if (sshId && !key) {
      /**
       * Delete existing key.
       * Expected result: { status: 'complete'}
      */
      return httpDelete({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys/${sshId}`,
        input: '',
      })
    } else {
      /**
       * Create new key.
       * Expected result from POST before 4.4.5 : { status: 'complete'}
       * Expected result from 4.4.5 : { user: <> , content: <>, id: <>, href: <> }
       *
       * Since legacy POST method does not return the newly created key/key_id we need to
       * fetch it imemdiately after (successful) creation.
       */
      return httpPost({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys`,
        input,
      }).then(({ content, id }) => {
        if (content && id) {
          return ({ content, id })
        }
        return OvirtApi.getSSHKey({ userId })
      })
    }
  },

  getSSHKey ({ userId }: { userId: string }): Promise<Object> {
    assertLogin({ methodName: 'getSSHKey' })
    // Expected result from GET: { ssh_public_key : [ { user: <> , content: <>, id: <>, href: <> }]}
    // return empty key if there are no keys
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/users/${userId}/sshpublickeys` })
      .then(({ ssh_public_key: [firstKey = {}] = [] }) => firstKey)
  },

  persistUserOption ({ name, content, optionId, userId }: Object): Promise<Object> {
    assertLogin({ methodName: 'persistUserOption' })
    const input = JSON.stringify(Transforms.RemoteUserOption.toApi(name, { content }))
    console.log('optionId', optionId, 'input', input)
    if (optionId) {
      // delete existing property and create a new one with updated content
      return httpDelete({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/options/${optionId}`,
        input: '',
      }).then(() => httpPost({
        url: `${AppConfiguration.applicationContext}/api/users/${userId}/options`,
        input,
      }))
    }
    return httpPost({
      url: `${AppConfiguration.applicationContext}/api/users/${userId}/options`,
      input,
    })
  },

  fetchUserOptions ({ userId }: { userId: string }): Promise<Object> {
    assertLogin({ methodName: 'fetchUserOptions' })
    // Expected result from GET: { user_option : [ { user: <> , content: <>, id: <>, name: <> }]}
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/users/${userId}/options` })
      .then(({ user_option: options = [] }) => options)
  },

  deleteUserOption ({ userId, optionId }: Object): Promise<Object> {
    assertLogin({ methodName: 'deleteUserOption' })
    return httpDelete({
      url: `${AppConfiguration.applicationContext}/api/users/${userId}/options/${optionId}`,
      input: '',
    })
  },

  getAllVnicProfiles (): Promise<Object> {
    assertLogin({ methodName: 'getVnicProfiles' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vnicprofiles?follow=network,permissions` })
  },

  getVmNic ({ vmId }: { vmId: string }): Promise<Object> {
    assertLogin({ methodName: 'getVmNic' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/nics?follow=reporteddevices` })
  },
  getAllNetworks (): Promise<Object> {
    assertLogin({ methodName: 'getNetworks' })
    return httpGet({ url: `${AppConfiguration.applicationContext}/api/networks` })
  },

  getEngineOption ({ optionName }: { optionName: string }): Promise<Object> {
    assertLogin({ methodName: 'getEngineOption' })

    return httpGet({
      url: `${AppConfiguration.applicationContext}/api/options/${optionName}`,
      custHeaders: {
        Accept: 'application/json',
        Filter: true,
      },
    })
  },
}

// export default new Proxy(OvirtApi, {
//   get (target: Object, prop: string, receiver: Object): any {
//     if (typeof target[prop] === 'function') {
//       console.info(`getting OvirtApi.${prop}`)
//     }
//     return Reflect.get(...arguments)
//   },
// })
export default OvirtApi
export {
  Transforms,
}
