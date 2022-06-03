import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { isNumber } from '_/utils'
import { createDiskTypeList, createStorageDomainList, isDiskNameValid } from '_/components/utils'
import { withMsg } from '_/intl'

import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Modal,
  ModalVariant,
  NumberInput,
  TextInput,
} from '@patternfly/react-core'
import style from './style.css'
import { InfoTooltip } from '_/components/tooltips'
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons'

const DISK_DEFAULTS = {
  bootable: false,
  diskType: 'thin', // constrain to values in DISK_TYPES
  provisionedSize: 1 * 1024 ** 3,
}

/**
 * Collect required information required to create a new or edit an existing Disk Image
 * for a VM.
 *
 * Note: Only deal with Disk Images.  Does not support iSCSI/LUN or Cinder disks.
 *
 * Note 2: Ultimately will use the DiskAttachments Services to create and DiskAttachment
 *         service to edit and remove disk images.
 *
 *    http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachments/methods/add
 *    http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachment/methods/update
 *    http://ovirt.github.io/ovirt-engine-api-model/master/#services/disk_attachment/methods/remove
 *
 * Needed for Create:
 *   - Alias (aka Name) (defaulting to a suggested name)
 *   - Size in GiB
 *   - Storage Domain (defaulted to a suggested storage domain)
 *   - Disk Type (Thin Provision vs Preallocated)
 *   - (auto-selected and never on the UI): Interface
 *
 * May be changed via Edit for a Disk Image (type == 'image'):
 *   - Alias
 *   - Size, but only allow extension: "Extend size by (GiB)"
 *
 * May be changed via Edit for a Direct LUN (type == 'lun'):
 *   - Alias
 */
class DiskImageEditor extends Component {
  constructor (props) {
    super(props)
    const { storageDomainList, dataCenterId, locale, msg } = this.props
    this.state = {
      showModal: false,
      storageDomainSelectList: createStorageDomainList({ storageDomains: storageDomainList, dataCenterId, includeUsage: true, locale, msg }),

      id: undefined,
      values: {
        alias: props.suggestedName || '',
        size: DISK_DEFAULTS.provisionedSize / 1024 ** 3,
        storageDomain: props.suggestedStorageDomain || '',
        bootable: DISK_DEFAULTS.bootable,
        diskType: DISK_DEFAULTS.diskType,
      },
      errors: {},
    }
    this.changesMade = false

    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.composeDiskEdit = this.composeDiskEdit.bind(this)
    this.composeNewDisk = this.composeNewDisk.bind(this)
    this.isFormValid = this.isFormValid.bind(this)
    this.validateField = this.validateField.bind(this)
    this.handleSave = this.handleSave.bind(this)

    this.changeAlias = this.changeAlias.bind(this)
    this.changeSize = this.changeSize.bind(this)
    this.changeStorageDomain = this.changeStorageDomain.bind(this)
    this.changeBootable = this.changeBootable.bind(this)
    this.changeDiskType = this.changeDiskType.bind(this)
  }

  open (e) {
    e.preventDefault()
    const { disk, suggestedName, suggestedStorageDomain, storageDomainList, dataCenterId, locale, msg } = this.props
    const { storageDomainSelectList } = this.state
    const diskInfo = disk
      ? { // edit
        id: disk.get('id'),
        values: {
          alias: disk.get('name'),
          bootable: disk.get('bootable'),
          size: 0,
          storageDomain: disk.get('storageDomainId'),

          // NOTE: Key the diskType from the disk's sparse flag.  Webadmin always uses
          //       raw when creating disks on file type storage domain.  When editing
          //       a disk, using __sparse__ this is the most reliable way to determine
          //       the thin vs preallocated status.
          diskType: disk.get('sparse') ? 'thin' : 'pre',
        },
      }
      : { // new
        id: undefined,
        values: {
          alias: suggestedName,
          bootable: this.props.vm.get('disks').size > 0 ? DISK_DEFAULTS.bootable : true,
          size: DISK_DEFAULTS.provisionedSize / 1024 ** 3,
          storageDomain:
            (/\w+/.test(suggestedStorageDomain) && suggestedStorageDomain) ||
            (storageDomainSelectList.length > 0 && storageDomainSelectList[0].id) ||
            '',

          diskType: DISK_DEFAULTS.diskType,
        },
        errors: {},
      }

    this.setState({
      showModal: true,
      storageDomainSelectList: createStorageDomainList({ storageDomains: storageDomainList, dataCenterId, includeUsage: true, locale, msg }),
      ...diskInfo,
    })
    this.changesMade = false
  }

  close () {
    this.setState({ showModal: false })
  }

  /**
   * Create a minimal `DiskType` object to effect the changes made by the user.  We
   * only want to send the fields that are either required to identify a disk attachment/
   * disk or need to change.  This minimizes issues.
   */
  composeDiskEdit () {
    const { disk } = this.props
    const { values } = this.state

    const provisionedSize = disk.get('provisionedSize') + values.size * 1024 ** 3

    return disk.get('type') === 'image'
      ? { // image disk (change name, size, bootable)
        attachmentId: disk.get('attachmentId'),
        id: disk.get('id'),

        bootable: values.bootable,
        name: values.alias,
        provisionedSize,
      }
      : { // cinder or lun disk (only change name and bootable)
        attachmentId: disk.get('attachmentId'),
        id: disk.get('id'),
        type: disk.get('type'),

        bootable: values.bootable,
        name: values.alias,
      }
  }

  /**
   * Create a minimal `DiskType` object to create a disk as specified by the user.
   *
   * A disk's `iface` determines the kind of device the hypervisor uses to present
   * the disk to the VM.  The `iface` only affects the VM, it does not affect the disk
   * image at all.  If a new disk is in the same storage domain as an existing disk,
   * the existing disk's `iface` setting will be used.  This can make things easier for
   * VMs where the OS doesn't include support for `virtio_scsi` devices.
   */
  composeNewDisk () {
    const { vm, storageDomains } = this.props
    const { values } = this.state

    const vmDiskInSameStorageDomain =
      vm.get('disks') &&
      vm.get('disks').find(disk => disk.get('storageDomainId') === values.storageDomain)

    const iface = vmDiskInSameStorageDomain
      ? vmDiskInSameStorageDomain.get('iface')
      : 'virtio_scsi'

    const provisionedSize = values.size * 1024 ** 3

    const storageDomainDiskAttributes =
      storageDomains.getIn([values.storageDomain, 'diskTypeToDiskAttributes', values.diskType]).toJS()

    const newDisk = {
      active: true,
      bootable: values.bootable,
      iface,

      name: values.alias,
      type: 'image', // we only know how to create 'image' type disks
      provisionedSize,

      ...storageDomainDiskAttributes,
      storageDomainId: values.storageDomain,
    }

    return newDisk
  }

  validateField (field = '') {
    const { msg } = this.props
    const errors = this.state.errors
    let isErrorOnField = false

    switch (field) {
      case 'alias':
        if (!isDiskNameValid(this.state.values.alias)) {
          errors.alias = msg.diskNameValidationRules()
          isErrorOnField = true
        } else {
          delete errors.alias
        }
        break
    }

    this.setState((state) => ({ errors }))
    return isErrorOnField
  }

  handleSave () {
    if (!this.isFormValid()) {
      return
    }
    if (!this.props.disk || this.changesMade) {
      const newDisk = this.props.disk ? this.composeDiskEdit() : this.composeNewDisk()
      this.props.onSave(this.props.vm.get('id'), newDisk)
    }
    this.close()
  }

  changeAlias (value) {
    this.setState(
      (state) => ({ values: { ...state.values, alias: value }, errors: { ...state.errors, alias: '' } }),
      () => {
        this.validateField('alias')
      })
    this.changesMade = true
  }

  changeSize (value) {
    if (isNumber(value) && value >= 0) {
      this.setState((state) => ({ values: { ...state.values, size: value } }))
      this.changesMade = true
    }
  }

  changeBootable (bootable) {
    this.setState((state) => ({ values: { ...state.values, bootable } }))
    this.changesMade = true
  }

  changeStorageDomain (value) {
    this.setState((state) => ({ values: { ...state.values, storageDomain: value } }))
    this.changesMade = true
  }

  changeDiskType (value) {
    this.setState((state) => ({ values: { ...state.values, diskType: value } }))
    this.changesMade = true
  }

  isFormValid () {
    const isErrors = Object.values(this.state.errors).reduce((acc, value) => (value !== undefined) ? true : acc, false)
    if (isErrors) {
      return false
    }

    // make sure that required fields have data
    const { values } = this.state
    return !!(this.props.disk
      // edit mode needs: a change, an alias and a disk size
      ? this.changesMade && !!values.alias // add size + bootable or leave like that
      // create mode needs: name, size, storage domain, disk format
      : values.alias && values.size > 0 && values.storageDomain && values.diskType
    )
  }

  render () {
    const { idPrefix, disk, trigger, vm, msg } = this.props
    const DISK_TYPES = createDiskTypeList(msg)

    const createMode = !disk
    const isImage = disk && disk.get('type') === 'image'
    const isDirectLUN = disk && disk.get('type') === 'lun'

    const diskSize = disk && (disk.get('lunSize') ? disk.get('lunSize') : disk.get('provisionedSize'))
    const vmIsDown = vm.get('status') === 'down'

    const isThisDiskCurrentBootable = disk && disk.get('bootable')
    const currentBootableDisk = vm.get('disks').find(disk => disk.get('bootable'))
    const showBootableChangeAlert = currentBootableDisk && !isThisDiskCurrentBootable && this.state.values.bootable

    return (
      <>
        { trigger({ onClick: this.open }) }

        <Modal
          id={`${idPrefix}-modal`}
          isOpen={this.state.showModal}
          onClose={this.close}
          variant={ModalVariant.medium}
          position='top'
          title={createMode ? msg.createNewDisk() : msg.editDisk()}
          actions={[
            <Button
              id={`${idPrefix}-modal-ok`}
              key='ok'
              variant='primary'
              onClick={this.handleSave}
              isDisabled={!this.isFormValid()}
            >
              { msg.ok() }
            </Button>,
            <Button
              id={`${idPrefix}-modal-cancel`}
              key='cancel'
              variant='link'
              onClick={this.close}
            >
              { msg.cancel() }
            </Button>,
          ]}
        >
          <Form
            isHorizontal
            id={`${idPrefix}-modal-form`}
          >
            {/* Alias */}
            <FormGroup
              label={ msg.diskEditorAliasLabel() }
              fieldId={`${idPrefix}-alias`}
              validated={this.state.errors.alias ? 'error' : null}
              helperTextInvalid={this.state.errors.alias}
              helperTextInvalidIcon={<ExclamationCircleIcon />}
            >
              <TextInput
                id={`${idPrefix}-alias`}
                type='text'
                defaultValue={this.state.values.alias}
                onChange={this.changeAlias}
              />
            </FormGroup>

            {/* Size Display (for edit mode) */}
            { !createMode && (
              <FormGroup
                label={ msg.diskEditorSizeEditLabel() }
                labelIcon={!isImage &&
                  <InfoTooltip id={`${idPrefix}-size-tooltip`} tooltip={msg.diskEditorSizeCantChangeHelp()} />}
                fieldId={`${idPrefix}-size`}
              >
                <div id={`${idPrefix}-size`} className={style['editor-field-read-only']}>
                  { diskSize / 1024 ** 3 }
                </div>
              </FormGroup>
            )}

            {/* Size Editor (initial size for create, expand by size for edit) */}
            { (createMode || isImage) && (
              <FormGroup
                label={createMode ? msg.diskEditorSizeLabel() : msg.diskEditorResizeLabel()}
                labelIcon={createMode && <InfoTooltip id={`${idPrefix}-size-edit-tooltip`} tooltip={msg.diskEditorSizeCreateInfoTooltip()} />}
                fieldId={`${idPrefix}-size-edit`}
                helperText={!createMode && msg.diskEditorResizeNote()}
              >
                <NumberInput
                  id={`${idPrefix}-size-edit`}
                  value={this.state.values.size}
                  onChange={({ target: { value } }) => this.changeSize(value)}
                  onMinus={() => this.changeSize(this.state.values.size - 1)}
                  onPlus={() => this.changeSize(this.state.values.size + 1)}
                  min={0}
                />
              </FormGroup>
            )}

            {/* Storage Domain */}
            <FormGroup
              label={ msg.diskEditorStorageDomainLabel() }
              labelIcon={(
                <InfoTooltip
                  id={`${idPrefix}-storage-domain-edit-tooltip`}
                  tooltip={
                    createMode
                      ? msg.diskEditorStorageDomainCreateHelp()
                      : msg.diskEditorStorageDomainCantChangeHelp()
                  }
                />
              )}
              fieldId={`${idPrefix}-storage-domain`}
            >
              { createMode && !isDirectLUN && (
                <FormSelect
                  id={`${idPrefix}-storage-domain`}
                  value={this.state.values.storageDomain}
                  onChange={this.changeStorageDomain}
                >
                  {this.state.storageDomainSelectList.map((option, index) => (
                    <FormSelectOption key={index} value={option.id} label={option.value} />
                  ))}
                </FormSelect>
              )}
              { !createMode && !isDirectLUN && (
                <div id={`${idPrefix}-storage-domain`} className={style['editor-field-read-only']}>
                  {
                      this.props.storageDomains.getIn([this.state.values.storageDomain, 'name']) ||
                      msg.diskEditorStorageDomainNotAvailable()
                    }
                </div>
              )}
              { isDirectLUN && (
                <div id={`${idPrefix}-storage-domain`} className={style['editor-field-read-only']}>
                  { msg.diskEditorStorageDomainNotAvailable() }
                </div>
              )}
            </FormGroup>

            {/* Disk Type (thin vs preallocated) */}
            <FormGroup
              label={ msg.diskEditorDiskTypeLabel() }
              labelIcon={(
                <InfoTooltip
                  id={`${idPrefix}-format-tooltip`}
                  tooltip={
                    createMode
                      ? msg.diskEditorDiskTypeCreateHelp()
                      : msg.diskEditorDiskTypeCantChangeHelp()
                  }
                />
              )}
              fieldId={`${idPrefix}-format`}
            >
              { createMode && !isDirectLUN && (
                <FormSelect
                  id={`${idPrefix}-format`}
                  value={this.state.values.diskType}
                  onChange={this.changeDiskType}
                >
                  {DISK_TYPES.map((option, index) => (
                    <FormSelectOption key={index} value={option.id} label={option.value} />
                  ))}
                </FormSelect>
              )}
              { !createMode && !isDirectLUN && (
                <div id={`${idPrefix}-format`} className={style['editor-field-read-only']}>
                  { this.state.values.diskType === 'pre' && msg.diskEditorDiskTypeOptionPre() }
                  { this.state.values.diskType === 'thin' && msg.diskEditorDiskTypeOptionThin() }
                </div>
              )}
              { isDirectLUN && (
                <div id={`${idPrefix}-format`} className={style['editor-field-read-only']}>
                  { msg.diskEditorDiskTypeNotAvailable() }
                </div>
              )}
            </FormGroup>

            {/* Disk Bootable */}
            <FormGroup
              label={ msg.diskEditorBootableLabel() }
              labelIcon={!vmIsDown && (
                <InfoTooltip
                  id={`${idPrefix}-bootable-edit-tooltip`}
                  tooltip={msg.bootableEditTooltip()}
                />
              )}
              fieldId={`${idPrefix}-bootable`}
              helperText={showBootableChangeAlert && (
                <HelperText>
                  <HelperTextItem variant="warning" hasIcon>
                    {msg.diskEditorBootableChangeMessage({ diskName: currentBootableDisk.get('name') }) }
                  </HelperTextItem>
                </HelperText>
              )}
            >
              <Checkbox
                isChecked={this.state.values.bootable}
                onChange={this.changeBootable}
                id={`${idPrefix}-bootable`}
                isDisabled={!vmIsDown}
              />
            </FormGroup>
          </Form>
        </Modal>
      </>
    )
  }
}

DiskImageEditor.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,

  disk: PropTypes.object, // if !!disk then edit mode
  suggestedName: PropTypes.string, // if suggestedName && !disk then create mode
  suggestedStorageDomain: PropTypes.string,

  storageDomainList: PropTypes.object.isRequired,
  trigger: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,

  storageDomains: PropTypes.object.isRequired,
  dataCenterId: PropTypes.string.isRequired,

  locale: PropTypes.string.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  (state, { vm }) => ({
    storageDomains: state.storageDomains,
    dataCenterId: state.clusters.getIn([vm.getIn(['cluster', 'id']), 'dataCenterId']),
  })
)(withMsg(DiskImageEditor))
