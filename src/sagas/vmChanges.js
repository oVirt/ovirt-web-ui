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
    // TODO? toast notify that Nics have been added
  ))

  // Assuming Disks cannot be added along with the VM create request, add them now
  yield all(disks.filter(disk => !disk.isFromTemplate).map(disk =>
    call(createNewDiskForNewVm, newVmId, disk)
    // TODO? toast notify that Disks have been added
  ))

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
  const {
    template,
    targetCluster,
    storageDomains,
  } = yield select(state => ({
    template: state.templates.get(basic.templateId),
    targetCluster: state.clusters.get(basic.clusterId),
    storageDomains: state.storageDomains,
  }))

  // basic info from the template
  const vmUpdates = {
    template: { id: template.get('id') },

    cpu: {
      topology: (basic.cpus === template.getIn(['cpu', 'vCPUs']))
        ? template.getIn(['cpu', 'topology']).toJS()
        : vm.cpu.topology,
    },
  }

  // handle the template disks along with VM creation - new disks are added after the VM is created
  /*
   * Each template defined VM disk will be evaluated and the composed VM will be adjusted
   * as needed to handle:
   *   - creating the VM's disk in a storage domain different from the one
   *     defined in the template
   *   - changing the VM disk's attributes considering the details below
   *
   * The creation of VM disks from the template disks depends on at least the following:
   *   - the __type__/optimizedFor value of the template
   *   - the type/__optimizedFor__ value of the VM
   *   - the 'storage allocation' of template(1)
   *   - the template disk's __format__ and sometimes __sparse__
   *   - values of the target storage domain of the VM disk(2):
   *     - __storageType__
   *     - the default disk format to sparse mapping
   *   - the __isCopyPreallocatedFileBasedDiskSupported__ value of the template or
   *     the target cluster (depending on the type of storage domain)
   *
   * (1) - The 'storage allocation' maps to the behavior of the resource allocation tab
   *       on webadmin's create new vm from a template modal and has the values of 'thin'
   *       or 'clone'.  This value is not editable or visible to the user in this app.
   *         Thin:  The VM's disk will be create as qcow/sparse and will operate as an
   *                overlay on top of the existing template disk's image.  This is only
   *                available if all of the VM's disks can be created in the same
   *                storage domain as their corresponding template disks.
   *         Clone: The VM's disks will be fully independent clones of the template
   *                disks.  When cloning, a new VM will not be able to run until the
   *                storage domains finish cloning the template disk images.  If any
   *                disk needs to be cloned, all disks will be cloned.  A change in
   *                storage domain for any disk will force the storage allocation to
   *                clone.
   *
   * (2) - In this app, a VM's disk can change storage domain only if the template's disk
   *       resides in a storage domain where the user does not have permissions to create
   *       a disk.
   *
   * See: http://ovirt.github.io/ovirt-engine-api-model/master/#services/vms/methods/add
   */
  const disksFromTemplate = disks
    .filter(disk => disk.isFromTemplate)
    .map(disk => ({
      disk,
      templateDisk: template.get('disks').find(tdisk => tdisk.get('id') === disk.id),
    }))

  const vmIsDesktop = basic.optimizedFor === 'desktop'
  const storageAllocation =
    vmIsDesktop &&
    disksFromTemplate.every(({ disk, templateDisk }) => disk.storageDomainId === templateDisk.get('storageDomainId'))
      ? 'thin'
      : 'clone'

  const diskChanges = disksFromTemplate.map(({ disk, templateDisk }) => {
    const changes = {}

    // did the disk's storage domain change?
    if (disk.storageDomainId !== templateDisk.get('storageDomainId')) {
      changes.storage_domains = {
        storage_domain: [{ id: disk.storageDomainId }],
      }
    }

    // figure out the disk's attributes
    const targetSD = storageDomains.get(disk.storageDomainId)
    Object.assign(
      changes,
      determineTemplateDiskFormatAndSparse({
        templateDisk,
        template,
        vmIsDesktop,
        vmStorageAllocationIsThin: storageAllocation === 'thin',
        targetSD,
        targetCluster,
      })
    )

    return Object.keys(changes).length === 0
      ? false
      : { id: disk.id, ...changes }
  })

  // if we change ANY disk on the template, we need to send in ALL disks
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
 * what changes the user has made to the VM from the template, and the disk's target
 * storage domain.
 *
 * Template values and Webadmin choices in the new VM modal flow down ultimately to the
 * template defined VM disk's specific attributes.  The default 'storage allocation' maps
 * based on the template optimizedFor, VM optimizedFor and target storage domain.  This
 * chart captures what format and sparse values are produced in webadmin:
 *
 *   [Template OptimizedFor -> VM OptimizedFor -> SD changes? ~~ Storage allocation ... disk format/sparse outcome]
 *   (* = default)
 *
 *   Server  -> Server*  -> No SD changes* ~~ Clone ... format stays the same, sparse stays the same
 *   Server  -> Server*  -> SD changes     ~~ Clone ... format stays the same, sparse changes as necessary based on format + SD
 *   Server  -> Desktop  -> No SD changes* ~~ Thin  ... format: cow, sparse: true
 *   Server  -> Desktop  -> SD changes     ~~ Clone ... format: cow, sparse: true (Thin settings retained)
 *   Desktop -> Desktop* -> No SD changes* ~~ Thin  ... format: cow, sparse: true
 *   Desktop -> Desktop* -> SD changes     ~~ Clone ... format: cow, sparse: true (Thin settings retained)
 *   Desktop -> Server   -> No SD changes* ~~ Clone ... format: cow, sparse: true (Thin settings retained)
 *   Desktop -> Server   -> SD changes     ~~ Clone ... format: cow, sparse: true (Thin settings retained)
 *
 * @param templateDisk Disk as defined in the template
 * @param template Template the VM is being created from
 * @param templateIsDesktop Is the template type 'desktop'?
 * @param vmIsDesktop Is the VM being created with user selectable type/optimizedFor 'desktop'?
 * @param vmStorageAllocationIsThin Is the net storage allocation for this VM 'thin'?
 * @param targetSD The storage domain where the disk will be created
 * @param targetCluster The cluster where the VM will be created
 */
export function determineTemplateDiskFormatAndSparse ({
  templateDisk,
  template,
  templateIsDesktop = template.get('type') === 'desktop',
  vmIsDesktop,
  vmStorageAllocationIsThin,
  targetSD,
  targetCluster,
}) {
  const attributes = {}
  const isCopyPreallocatedFileBasedDiskSupported =
    template.get('isCopyPreallocatedFileBasedDiskSupported') ?? targetCluster.get('isCopyPreallocatedFileBasedDiskSupported')

  if (vmStorageAllocationIsThin || templateIsDesktop || vmIsDesktop) {
    attributes.format = 'cow'
    attributes.sparse = targetSD.get('templateDiskFormatToSparse')('cow', isCopyPreallocatedFileBasedDiskSupported, templateDisk)
  } else {
    const format = templateDisk.get('format')
    const sparse =
      targetSD.get('id') === templateDisk.get('storageDomainId')
        ? templateDisk.get('sparse')
        : targetSD.get('templateDiskFormatToSparse')(format, isCopyPreallocatedFileBasedDiskSupported, templateDisk)

    attributes.format = format
    attributes.sparse = sparse
  }

  return (templateDisk.get('format') === attributes.format && templateDisk.get('sparse') === attributes.sparse)
    ? {}
    : attributes
}

/**
 * Create a new disk for a newly created vm.
 */
function* createNewDiskForNewVm (newVmId, disk) {
  const storageDomainDiskAttributes = yield select(({ storageDomains }) =>
    storageDomains.getIn([disk.storageDomainId, 'diskTypeToDiskAttributes', disk.diskType]).toJS()
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
