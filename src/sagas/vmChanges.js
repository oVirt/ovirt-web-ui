import { put, select, takeEvery, takeLatest, all, call } from 'redux-saga/effects'
import { push } from 'connected-react-router'
import merge from 'lodash/merge'

import Api from '_/ovirtapi'
import * as A from '_/actions'
import * as C from '_/constants'
import { arrayMatch } from '_/utils'

import { callExternalAction, delay, delayInMsSteps } from './utils'
import { addVmNic, fetchAndPutSingleVm } from './index'
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
  const osType = yield select(state => state.operatingSystems.getIn([basic.operatingSystemId, 'name']))
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
    const [vmUpdates, cdrom_] = yield composeProvisionSourceIso({ vm, basic })

    cdrom = cdrom_
    merge(vm, vmUpdates)
  }

  // Provision = TEMPLATE
  if (basic.provisionSource === 'template') {
    const [vmUpdates, vmRequiresClone_] = yield composeProvisionSourceTemplate({ vm, basic, disks })

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
  const newNics = nics.filter(nic => !nic.isFromTemplate)
  if (newNics.length > 0) {
    yield all(newNics.map(nic =>
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
    // TODO? toast notify that Nics have been added
  }

  // Assuming Disks cannot be added along with the VM create request, add them now
  const newDisks = disks.filter(disk => !disk.isFromTemplate)
  if (newDisks.length > 0) {
    yield all(newDisks.map(disk => call(createNewDiskForNewVm, newVmId, disk)))
    // TODO? toast notify that Disks have been added
  }

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
          device: ['cdrom'],
        },
      },
    },
  }

  return [vmUpdates, cdrom]
}

function* composeProvisionSourceTemplate ({ vm, basic, disks }) {
  const template = yield select(({ templates }) => templates.get(basic.templateId))

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
   * the one defined in the template, or if the disk's format/sparse values need to be
   * changed, pass those changes along in the VM create call.
   *
   * See: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vms/methods/add
   */
  const storageDomains = yield select(state => state.storageDomains) // { [id]: sd }
  const disksFromTemplate = disks
    .filter(disk => disk.isFromTemplate)
    .map(disk => ({ disk, baseDisk: template.get('disks').find(tdisk => tdisk.get('id') === disk.id) }))

  const templateOptimizedFor = template.get('type')
  const vmOptimizedFor = basic.optimizedFor
  const storageAllocation =
    vmOptimizedFor === 'desktop' &&
    disksFromTemplate.every(({ disk, baseDisk }) => disk.storageDomainId === baseDisk.get('storageDomainId'))
      ? 'thin'
      : 'clone'

  const diskChanges = disksFromTemplate.map(({ disk, baseDisk }) => {
    const changes = {}

    // did the disk's storage domain change?
    if (disk.storageDomainId !== baseDisk.get('storageDomainId')) {
      changes.storage_domains = {
        storage_domain: [{ id: disk.storageDomainId }],
      }
    }

    // figure out the disk's format and sparse values
    const targetSD = storageDomains.get(disk.storageDomainId)
    Object.assign(
      changes,
      determineTemplateDiskFormatAndSparse(templateOptimizedFor, vmOptimizedFor, baseDisk, disk, storageAllocation, targetSD)
    )

    return Object.keys(changes).length === 0
      ? false
      : { id: disk.id, ...changes }
  })

  /*
   * If we change ANY disk on the template, we need to send in ALL disks.
   */
  if (diskChanges.some(Boolean)) {
    vmUpdates.disk_attachments = {
      disk_attachment: diskChanges.map(
        (changed, index) => ({
          disk: changed || { id: disksFromTemplate[index].disk.id },
        })
      ),
    }
  }

  return [vmUpdates, storageAllocation === 'clone']
}

/**
 * Select the disk's __format__ and __sparse__ based on where the disk is coming from,
 * what changes the user has made to the VM from the template, and what the disk's
 * target storage domain looks like.
 *
 * Webadmin behavior:
 *   [Template OptimizedFor -> VM OptimizedFor -> SD changes? ~~ Storage allocation ... disk format/sparse outcome]
 *   (* = default)
 *
 *   Server  -> Server*  -> No SD changes* ~~ Clone ... format stays the same, sparse stays the same
 *   Server  -> Server*  -> SD changes ~~ Clone     ... format stays the same, sparse changes as necessary based on format + SD
 *   Server  -> Desktop  -> No SD changes* ~~ Thin  ... format: cow, sparse: true
 *   Server  -> Desktop  -> SD changes ~~ Clone     ... format: cow, sparse: true (Thin settings retained)
 *   Desktop -> Desktop* -> No SD changes* ~~ Thin  ... format: cow, sparse: true
 *   Desktop -> Desktop* -> SD changes ~~ Clone     ... format: cow, sparse: true (Thin settings retained)
 *   Desktop -> Server   -> No SD changes* ~~ Clone ... format: cow, sparse: true (Thin settings retained)
 *   Desktop -> Server   -> SD changes ~~ Clone     ... format: cow, sparse: true (Thin settings retained)
 */
function determineTemplateDiskFormatAndSparse (templateOptimizedFor, vmOptimizedFor, baseDisk, userDisk, storageAllocation, targetSD) {
  const attributes = {}

  if (storageAllocation === 'thin') {
    attributes.format = 'cow'
    attributes.sparse = targetSD.getIn(['defaultDiskFormatToSparse', 'cow'])
  }

  if (templateOptimizedFor === 'desktop' || vmOptimizedFor === 'desktop') {
    attributes.format = 'cow'
    attributes.sparse = targetSD.getIn(['defaultDiskFormatToSparse', 'cow'])
  }

  if (templateOptimizedFor === 'server' && vmOptimizedFor === 'server') {
    const format = baseDisk.get('format')
    const sparse =
      userDisk.storageDomainId === baseDisk.get('storageDomainId')
        ? baseDisk.get('sparse')
        : targetSD.getIn(['defaultDiskFormatToSparse', format])

    attributes.format = format
    attributes.sparse = sparse
  }

  return (baseDisk.get('format') === attributes.format && baseDisk.get('sparse') === attributes.sparse)
    ? {}
    : attributes
}

/**
 * Create a new disk for a newly created vm.
 */
function* createNewDiskForNewVm (newVmId, disk) {
  const storageDomainDiskAttributes = yield select(({ storageDomains }) =>
    storageDomains.getIn([disk.storageDomainId, 'diskAttributesForDiskType', disk.diskType]).toJS()
  )

  yield createDiskForVm(A.createDiskForVm({
    vmId: newVmId,
    disk: {
      active: true,
      bootable: disk.bootable,
      iface: 'virtio_scsi',

      name: disk.name,
      type: 'image', // we only know how to create 'image' type disks
      provisionedSize: disk.size,

      ...storageDomainDiskAttributes,
      storageDomainId: disk.storageDomainId,
    },
  }))
}

/*
 * Create a new VM, fetch it and optionally push the user to the VM detail page
 * for the new VM.
 */
function* createVm (action) {
  const correlationId = action?.meta?.correlationId

  // Create the VM
  const createVmResult = yield callExternalAction(Api.addNewVm, action)
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
      yield fetchAndPutSingleVm(A.getSingleVm({ vmId }))
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
    for (const delayMs of delayInMsSteps(isCloning ? 20 : 200)) {
      yield delay(delayMs)

      const check = yield callExternalAction(Api.getVm, { payload: { vmId } }, true)
      if (check?.id === vmId && check?.status !== 'image_locked') {
        break
      }
    }

    yield fetchAndPutSingleVm(A.getSingleVm({ vmId }))
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
  const onlyNeedChangeCd = vm && arrayMatch(Object.keys(vm), ['id', 'cdrom'])

  const editVmResult = onlyNeedChangeCd
    ? {}
    : yield callExternalAction(Api.editVm, action)

  let commitError = editVmResult.error
  if (!commitError && vm.cdrom) {
    const changeCdResult = yield changeVmCdRom(A.changeVmCdRom({
      vmId,
      cdrom: vm.cdrom,
      current: action.payload.changeCurrentCd,
    }))

    commitError = changeCdResult.error
  }

  // if edit call succeed, deep fetch refresh the VM with the updates applied
  if (!commitError) {
    yield put(A.getSingleVm({ vmId }))
  }

  if (action?.meta?.correlationId) {
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
  const result = yield callExternalAction(Api.changeCdRom, action)

  if (action?.meta?.correlationId) {
    yield put(A.setVmActionResult({
      vmId: action.payload.vmId,
      correlationId: action.meta.correlationId,
      result: !result.error,
    }))
  }

  return result
}

export function* startProgress ({ vmId, poolId, name }) {
  if (vmId) {
    yield put(A.vmActionInProgress({ vmId, name, started: true }))
  } else {
    yield put(A.poolActionInProgress({ poolId, name, started: true }))
  }
}

export function* stopProgress ({ vmId, poolId, name, result }) {
  if (result?.status === 'complete' && result?.job?.id) {
    // If the result is complete, refresh the entity to grab the current status
    if (vmId) {
      yield put(A.getSingleVm({ vmId, shallowFetch: true }))
    } else {
      yield put(A.getSinglePool({ poolId }))
    }

    // If the result has an async job associated with it, wait
    // for the job to finish then refresh the VM or Pool again
    const jobId = result.job.id

    for (const delayMs of delayInMsSteps()) {
      yield delay(delayMs)

      const check = yield callExternalAction(Api.getJob, { payload: { jobId } }, true)
      if (check.end_time) {
        break
      }
    }

    if (vmId) {
      yield put(A.getSingleVm({ vmId }))
    } else {
      yield put(A.getSinglePool({ poolId }))
    }
  }

  if (vmId) {
    yield put(A.vmActionInProgress({ vmId, name, started: false }))
  } else {
    yield put(A.poolActionInProgress({ poolId, name, started: false }))
  }
}

function* shutdownVm (action) {
  const vmId = action.payload.vmId
  yield startProgress({ vmId, name: 'shutdown' })

  const result = yield callExternalAction(Api.shutdown, action)
  if (result.status === 'complete') {
    const vmName = yield select(state => state.vms.getIn(['vms', action.payload.vmId, 'name']))
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackShutdownVm', params: { VmName: vmName } }, type: 'success' }))
  }

  yield stopProgress({ vmId, name: 'shutdown', result })
}

function* restartVm (action) {
  const vmId = action.payload.vmId
  yield startProgress({ vmId, name: 'restart' })

  const result = yield callExternalAction(Api.restart, action)
  if (result.status === 'complete') {
    const vmName = yield select(state => state.vms.getIn(['vms', action.payload.vmId, 'name']))
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackRestartVm', params: { VmName: vmName } }, type: 'success' }))
  }

  yield stopProgress({ vmId, name: 'restart', result })
}

function* suspendVm (action) {
  const vmId = action.payload.vmId
  yield startProgress({ vmId, name: 'suspend' })

  const result = yield callExternalAction(Api.suspend, action)
  if (result.status === 'pending') {
    const vmName = yield select(state => state.vms.getIn(['vms', action.payload.vmId, 'name']))
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackSuspendVm', params: { VmName: vmName } }, type: 'success' }))
  }

  yield stopProgress({ vmId, name: 'suspend', result })
}

function* startVm (action) {
  const vmId = action.payload.vmId
  yield startProgress({ vmId, name: 'start' })

  const result = yield callExternalAction(Api.start, action)
  // TODO: check status at refresh --> conditional refresh wait_for_launch
  if (result.status === 'complete') {
    const vmName = yield select(state => state.vms.getIn(['vms', action.payload.vmId, 'name']))
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackStartVm', params: { VmName: vmName } }, type: 'success' }))
  }

  yield stopProgress({ vmId, name: 'start', result })
}

function* startPool (action) {
  const poolId = action.payload.poolId
  yield startProgress({ poolId, name: 'start' })

  const result = yield callExternalAction(Api.startPool, action)
  if (result.status === 'complete') {
    const poolName = yield select(state => state.vms.getIn(['pools', action.payload.poolId, 'name']))
    yield put(A.addUserMessage({ messageDescriptor: { id: 'actionFeedbackAllocateVm', params: { poolname: poolName } }, type: 'success' }))
  }

  yield stopProgress({ poolId, name: 'start', result })
}

function* removeVm (action) {
  const vmId = action.payload.vmId
  yield startProgress({ vmId, name: 'remove' })

  const result = yield callExternalAction(Api.remove, action)
  if (result.status === 'complete') {
    yield put(A.updateVms({ removeVmIds: [vmId] }))
    yield put(push('/'))
  }

  yield stopProgress({ vmId, name: 'remove', result })
}

export default [
  // Create and make changes to a VM
  takeLatest(C.COMPOSE_CREATE_VM, composeAndCreateVm),
  takeLatest(C.CREATE_VM, createVm),
  takeLatest(C.CHANGE_VM_CDROM, changeVmCdRom),
  takeLatest(C.EDIT_VM, editVm),
  takeLatest(C.REMOVE_VM, removeVm),

  // VM Status Changes
  takeEvery(C.ACTION_IN_PROGRESS_START, function* (action) { yield startProgress(action.payload) }),
  takeEvery(C.ACTION_IN_PROGRESS_STOP, function* (action) { yield stopProgress(action.payload) }),
  takeEvery(C.SHUTDOWN_VM, shutdownVm),
  takeEvery(C.RESTART_VM, restartVm),
  takeEvery(C.START_VM, startVm),
  takeEvery(C.SUSPEND_VM, suspendVm),

  // Pool Status Changes
  takeEvery(C.START_POOL, startPool),
]
