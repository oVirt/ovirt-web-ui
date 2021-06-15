import { put, select, takeEvery, takeLatest, all, call } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import merge from 'lodash/merge'

import Api from '_/ovirtapi'
import * as A from '_/actions'
import * as C from '_/constants'
import { arrayMatch } from '_/utils'

import { callExternalAction, delay, delayInMsSteps } from './utils'
import { startProgress, stopProgress, addVmNic, fetchSingleVm } from './index'
import { createDiskForVm } from './disks'

function* createMemoryPolicyFromCluster (clusterId, memorySize) {
  const cluster = yield select(state => state.clusters.get(clusterId))
  const overCommitPercent = cluster && cluster.getIn(['memoryPolicy', 'overCommitPercent'])
  const guaranteed = overCommitPercent ? (memorySize * (100 / overCommitPercent)) : memorySize

  const memoryPolicy = {
    max: memorySize * C.MAX_VM_MEMORY_FACTOR,
    guaranteed: Math.round(guaranteed),
  }
  return memoryPolicy
}

/**
 * Compose the VM as JSON consumable directly by the REST API and
 * send it to be created.
 *
 * @see http://ovirt.github.io/ovirt-engine-api-model/master/#types/vm
 */
function* composeAndCreateVm ({ payload: { basic, nics, disks }, meta: { correlationId } }) {
  const osType = yield select(state => state.operatingSystems.getIn([ basic.operatingSystemId, 'name' ]))
  const memory = basic.memory * (1024 ** 2) // input in MiB, stored in bytes
  const memoryPolicy = yield createMemoryPolicyFromCluster(basic.clusterId, memory)

  // Common parts
  const vm = {
    cluster: { id: basic.clusterId },
    cpu: { topology: basic.topology },
    description: basic.description,
    memory_policy: memoryPolicy,
    memory,
    name: basic.name,
    os: { type: osType },
    type: basic.optimizedFor,
    time_zone: {
      name: basic.timeZone.name,
      utc_offset: basic.timeZone.offset,
    },

    initialization: basic.cloudInitEnabled
      ? {
        authorized_ssh_keys: basic.initSshKeys,
        custom_script: basic.initCustomScript,
        host_name: basic.initHostname,
        root_password: basic.initAdminPassword,
        timezone: basic.initTimezone,
      }
      : {},
  }
  let vmRequiresClone = false

  // Provision = ISO (setup boot to CD and "insert" the CD after the VM is created)
  let cdrom
  if (basic.provisionSource === 'iso') {
    const [ vmUpdates, cdrom_ ] = yield composeProvisionSourceIso({ vm, basic })

    cdrom = cdrom_
    merge(vm, vmUpdates)
  }

  // Provision = TEMPLATE
  if (basic.provisionSource === 'template') {
    const [ vmUpdates, vmRequiresClone_ ] = yield composeProvisionSourceTemplate({ vm, basic, disks })

    vmRequiresClone = vmRequiresClone_
    merge(vm, vmUpdates)
  }

  const clonePermissions = basic.provisionSource === 'template'

  /*
   * NOTE: The VM create REST service does not handle adding NICs or Disks. Until
   *       the create service supports this, we will add Nics and Disks individually
   *       after the VM has been created and is no longer image locked.
   */
  const newVmId = yield createVm(
    A.createVm({ vm, cdrom, clone: vmRequiresClone, clonePermissions, transformInput: false }, { correlationId })
  )

  if (newVmId === -1) {
    return
  }

  // Wait for the VM image to be unlocked before adding NICs and Disks
  yield waitForVmToBeUnlocked(newVmId, vmRequiresClone)

  // Assuming NICs cannot be added along with the VM create request, add them now
  yield all(nics.filter(nic => !nic.isFromTemplate).map(nic =>
    call(addVmNic, A.addVmNic({
      vmId: newVmId,
      nic: {
        name: nic.name,
        plugged: true,
        linked: true,
        vnicProfile: { id: nic.vnicProfileId },
        interface: nic.deviceType,
      },
    }))
  ))
  // TODO? If cloning, toast notify that NICs have been added.

  // Assuming Disks cannot be added along with the VM create request, add them now
  yield all(disks.filter(disk => !disk.isFromTemplate).map(disk =>
    call(createDiskForVm, A.createDiskForVm({
      vmId: newVmId,
      disk: {
        active: true,
        bootable: disk.bootable,
        iface: disk.iface,

        name: disk.name,
        type: 'image',
        format: 'raw', // Match webadmin behavior, disks are created as 'raw'
        sparse: disk.diskType === 'thin',
        provisionedSize: disk.size,

        storageDomainId: disk.storageDomainId,
      },
    }))
  ))
  // TODO? If cloning, toast notify that Disks have been added.

  // start on create, but after everything else is done...
  if (newVmId !== -1 && basic.startOnCreation) {
    yield put(A.startVm({ vmId: newVmId }))
  }
}

function* composeProvisionSourceIso ({ vm, basic }) {
  const cdrom = {
    fileId: basic.isoImage,
  }

  const vmUpdates = {
    template: { id: yield select(state => state.config.get('blankTemplateId')) },

    os: {
      boot: {
        devices: {
          device: [ 'cdrom' ],
        },
      },
    },
  }

  return [ vmUpdates, cdrom ]
}

function* composeProvisionSourceTemplate ({ vm, basic, disks }) {
  const template = yield select(state => state.templates.get(basic.templateId))

  const vmStorageAllocation = basic.optimizedFor === 'desktop' ? 'thin' : 'clone'
  const templateStorageAllocation = template.get('type') === 'desktop' ? 'thin' : 'clone'
  let diskRequiresClone = false

  const vmUpdates = {
    template: { id: template.get('id') },

    cpu: {
      topology: (basic.cpus === template.getIn(['cpu', 'vCPUs']))
        ? template.getIn(['cpu', 'topology']).toJS()
        : vm.cpu.topology,
    },
  }

  /*
   * If a template defined disk needs to be created in a storage domain different than
   * the one defined in the template, or if the disk's sparse value is changed, the
   * changes need to passed along in the VM create call.
   *
   * See: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vms/methods/add
   */
  disks
    .filter(disk => disk.isFromTemplate)
    .forEach(disk => {
      const templateDisk = template.get('disks').find(tdisk => tdisk.get('id') === disk.id)
      if (!templateDisk) {
        return
      }

      const changesToTemplateDisk = {
        id: disk.id,
      }

      // make sure disk format (and therefore sparse) matches the template's storageAllocation
      if (templateStorageAllocation === 'thin') {
        changesToTemplateDisk.format = 'cow'
      } else if (templateStorageAllocation === 'clone') {
        changesToTemplateDisk.format = vmStorageAllocation === 'thin' ? 'cow' : 'raw'
      }

      // did the storage domain change?
      if (disk.storageDomainId !== templateDisk.get('storageDomainId')) {
        diskRequiresClone = true
        changesToTemplateDisk.storage_domains = {
          storage_domain: [{ id: disk.storageDomainId }],
        }
      }

      if (Object.keys(changesToTemplateDisk).length > 1) {
        if (vmUpdates.disk_attachments) {
          // add another disk to clone
          vmUpdates.disk_attachments.disk_attachment.push({ disk: changesToTemplateDisk })
        } else {
          // initial setup a disk to clone
          vmUpdates.disk_attachments = {
            disk_attachment: [{
              disk: changesToTemplateDisk,
            }],
          }
        }
      }
    })

  return [ vmUpdates, vmStorageAllocation === 'clone' || diskRequiresClone ]
}

/*
 * Create a new VM, fetch it and optionally push the user to the VM detail page
 * for the new VM.
 */
function* createVm (action) {
  const correlationId = action.meta && action.meta.correlationId

  // Create the VM
  const createVmResult = yield callExternalAction('createVm', Api.addNewVm, action)
  const successCreate = !!createVmResult.id

  // Log the success of the action via correlation id
  if (correlationId) {
    yield put(A.setVmActionResult({
      correlationId,
      result: successCreate ? createVmResult.id : false,
    }))
  }

  // if the VM was created, and if one is provided, load the CD
  let successChangeCd = successCreate && !action.payload.cdrom
  if (successCreate && action.payload.cdrom) {
    const changeCdResult = yield changeVmCdRom(A.changeVmCdRom({
      vmId: createVmResult.id,
      cdrom: action.payload.cdrom,
      current: false,
    }, {
      correlationId,
    }))
    successChangeCd = !changeCdResult.error
  }

  // Navigate to (or just load) the VM's details
  if (successCreate && successChangeCd) {
    const vmId = createVmResult.id
    if (action.payload.pushToDetailsOnSuccess) {
      yield put(A.navigateToVmDetails(`/vm/${vmId}`))
    } else {
      yield fetchSingleVm(A.getSingleVm({ vmId }))
    }
    return vmId
  }

  return -1
}

/*
 * Poll at intervals and return when either the number of polling steps has completed,
 * or when the VM's image is no longer locked.  If the VM is being cloned, use 200 steps.
 * If not, use 20 steps.  Cloning requires a full copy of the Template disks, so the
 * process may take a long time.
 */
function* waitForVmToBeUnlocked (vmId, isCloning = false) {
  const vm = yield select(state => state.vms.getIn(['vms', vmId]))
  if (vm.get('status') === 'image_locked') {
    for (let delayMs of delayInMsSteps(isCloning ? 20 : 200)) {
      yield delay(delayMs)

      const check = yield callExternalAction('getVm', Api.getVm, { payload: { vmId } }, true)
      if (check && check.id === vmId && check.status !== 'image_locked') {
        break
      }
    }

    yield fetchSingleVm(A.getSingleVm({ vmId }))
  }
}

/*
 * Edit a VM by pushing (with a full or partial VM definition) VM updates, and if
 * new cdrom info is provided, change the cdrom as appropriate for the VM's status. A
 * running VM will have its current=true cdrom updated (to make the change immediate).
 * A non-running VM will have its current=false cdrom updated (to make the change apply
 * at next_run).
 */
function* editVm (action) {
  const { payload: { vm } } = action
  const vmId = vm.id
  const onlyNeedChangeCd = vm && arrayMatch(Object.keys(vm), [ 'id', 'cdrom' ])

  const editVmResult = onlyNeedChangeCd
    ? {}
    : yield callExternalAction('editVm', Api.editVm, action)

  let commitError = editVmResult.error
  if (!commitError && vm.cdrom) {
    const changeCdResult = yield changeVmCdRom(A.changeVmCdRom({
      vmId,
      cdrom: vm.cdrom,
      current: action.payload.changeCurrentCd,
      updateVm: false, // A.selectVmDetail will update the VMs info with all of the edits
    }))

    commitError = changeCdResult.error
  }

  if (!commitError) {
    // deep fetch refresh the VM with any/all updates applied
    yield put(A.selectVmDetail({ vmId }))
  }

  if (action.meta && action.meta.correlationId) {
    yield put(A.setVmActionResult({
      vmId,
      correlationId: action.meta.correlationId,
      result: !commitError,
    }))
  }

  if (!commitError && action.payload.restartAfterEdit) {
    yield put(A.restartVm({ vmId })) // non-blocking restart
  }
}

function* changeVmCdRom (action) {
  const result = yield callExternalAction('changeCdRom', Api.changeCdRom, action)

  if (action.meta && action.meta.correlationId) {
    yield put(A.setVmActionResult({
      vmId: action.payload.vmId,
      correlationId: action.meta.correlationId,
      result: !result.error,
    }))
  }

  return result
}

function* shutdownVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'shutdown' })
  const result = yield callExternalAction('shutdown', Api.shutdown, action)
  const vmName = yield select(state => state.vms.getIn([ 'vms', action.payload.vmId, 'name' ]))
  if (result.status === 'complete') {
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackShutdownVm', params: { VmName: vmName } }, type: 'success' }))
  }
  yield stopProgress({ vmId: action.payload.vmId, name: 'shutdown', result })
}

function* restartVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'restart' })
  const result = yield callExternalAction('restart', Api.restart, action)
  const vmName = yield select(state => state.vms.getIn([ 'vms', action.payload.vmId, 'name' ]))
  if (result.status === 'complete') {
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackRestartVm', 'params': { VmName: vmName } }, type: 'success' }))
  }
  yield stopProgress({ vmId: action.payload.vmId, name: 'restart', result })
}

function* suspendVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'suspend' })
  const result = yield callExternalAction('suspend', Api.suspend, action)
  const vmName = yield select(state => state.vms.getIn([ 'vms', action.payload.vmId, 'name' ]))
  if (result.status === 'pending') {
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackSuspendVm', params: { VmName: vmName } }, type: 'success' }))
  }
  yield stopProgress({ vmId: action.payload.vmId, name: 'suspend', result })
}

function* startVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'start' })
  const result = yield callExternalAction('start', Api.start, action)
  const vmName = yield select(state => state.vms.getIn([ 'vms', action.payload.vmId, 'name' ]))
  // TODO: check status at refresh --> conditional refresh wait_for_launch
  if (result.status === 'complete') {
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackStartVm', params: { VmName: vmName } }, type: 'success' }))
  }
  yield stopProgress({ vmId: action.payload.vmId, name: 'start', result })
}

function* startPool (action) {
  yield startProgress({ poolId: action.payload.poolId, name: 'start' })
  const result = yield callExternalAction('startPool', Api.startPool, action)
  const poolName = yield select(state => state.vms.getIn([ 'pools', action.payload.poolId, 'name' ]))
  if (result.status === 'complete') {
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackAllocateVm', params: { poolname: poolName } }, type: 'success' }))
  }
  yield stopProgress({ poolId: action.payload.poolId, name: 'start', result })
}

function* removeVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'remove' })
  const result = yield callExternalAction('remove', Api.remove, action)

  if (result.status === 'complete') {
    // TODO: Remove the VM from the store so we don't see it on the list page!
    yield put(push('/'))
  }

  yield stopProgress({ vmId: action.payload.vmId, name: 'remove', result })
}

export default [
  // Create and make changes to a VM
  takeLatest(C.COMPOSE_CREATE_VM, composeAndCreateVm),
  takeLatest(C.CREATE_VM, createVm),
  takeLatest(C.CHANGE_VM_CDROM, changeVmCdRom),
  takeLatest(C.EDIT_VM, editVm),
  takeLatest(C.REMOVE_VM, removeVm),

  // VM Status Changes
  takeEvery(C.SHUTDOWN_VM, shutdownVm),
  takeEvery(C.RESTART_VM, restartVm),
  takeEvery(C.START_VM, startVm),
  takeEvery(C.SUSPEND_VM, suspendVm),

  // Pool Status Changes
  takeEvery(C.START_POOL, startPool),
]
