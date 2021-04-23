import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { isNumber } from '_/utils'
import { createDiskTypeList, createStorageDomainList, isDiskNameValid } from '_/components/utils'
import { withMsg } from '_/intl'

import {
  Button,
  Checkbox,
  Col,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  Modal,
} from 'patternfly-react'
import { Alert } from '@patternfly/react-core'
import SelectBox from '_/components/SelectBox'
import style from './style.css'
import { Tooltip, InfoTooltip } from '_/components/tooltips'

const DISK_DEFAULTS = {
  active: true,
  iface: 'virtio_scsi', // virtio | virtio_scsi

  id: undefined,
  name: '',
  type: 'image',
  bootable: false,

  diskType: 'thin', // constrain to values in DISK_TYPES

  provisionedSize: 1 * 1024 ** 3,
}

const LabelCol = ({ children, ...props }) => {
  return <Col componentClass={ControlLabel} {...props}>
    { children }
  </Col>
}
LabelCol.propTypes = {
  children: PropTypes.node.isRequired,
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
    this.composeDisk = this.composeDisk.bind(this)
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

          // NOTE: Key the diskType from the disk's sparse flag.  Since webadmin always
          //       uses raw when creating disks, when editing a disk, this is the most
          //       reliable way to determine the thin vs preallocated status.
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

  // NOTE: Add and edit both can use the same composeDisk() since the add and edit
  //       sagas will use what they need from the composed disk.  The sagas ultimately
  //       control the REST calls and data.
  composeDisk () {
    const { vm, disk } = this.props
    const vmDiskInSameStorageDomain =
      vm.get('disks') &&
      vm.get('disks').find(disk => disk.get('storageDomainId') === this.state.values.storageDomain)

    const iface =
      (disk && disk.get('iface')) ||
      (vmDiskInSameStorageDomain && vmDiskInSameStorageDomain.get('iface')) ||
      'virtio_scsi'

    const provisionedSize = disk
      ? disk.get('provisionedSize') + this.state.values.size * 1024 ** 3
      : this.state.values.size * 1024 ** 3

    const bootable = this.state.values.bootable

    const newDisk = {
      ...DISK_DEFAULTS,
      attachmentId: disk && disk.get('attachmentId'),
      storageDomainId: this.state.values.storageDomain,

      iface,
      id: this.state.id,
      name: this.state.values.alias,
      provisionedSize,
      bootable,

      // the __diskType__ field maps to format + sparse REST Disk attributes
      format: 'raw', // Match webadmin behavior, disks are created as 'raw'
      sparse: this.state.values.diskType === 'thin',
    }

    if (disk && disk.get('type') !== 'image') {
      newDisk.type = disk.get('type')
      newDisk.provisionedSize = undefined
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
          errors['alias'] = msg.diskNameValidationRules()
          isErrorOnField = true
        } else {
          delete errors['alias']
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
      const newDisk = this.composeDisk()
      this.props.onSave(this.props.vm.get('id'), newDisk)
    }
    this.close()
  }

  changeAlias ({ target: { value } }) {
    this.setState(
      (state) => ({ values: { ...state.values, alias: value }, errors: { ...state.errors, 'alias': '' } }),
      () => {
        this.validateField('alias')
      })
    this.changesMade = true
  }

  changeSize ({ target: { value } }) {
    if (isNumber(value) && value >= 0) {
      this.setState((state) => ({ values: { ...state.values, size: value } }))
      this.changesMade = true
    }
  }

  changeBootable (event) {
    const target = event.target
    const bootable = target.type === 'checkbox' ? target.checked : target.value
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

    return <React.Fragment>
      { trigger({ onClick: this.open }) }

      <Modal
        dialogClassName={style['editor-modal']}
        id={`${idPrefix}-modal`}
        show={this.state.showModal}
        onHide={this.close}
      >
        <Modal.Header>
          <Modal.CloseButton id={`${idPrefix}-modal-close`} onClick={this.close} />
          <Modal.Title>{createMode ? msg.createNewDisk() : msg.editDisk()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <Form
            horizontal
            onSubmit={e => { e.preventDefault() }}
            id={`${idPrefix}-modal-form`}
          >
            {/* Alias */}
            <FormGroup controlId={`${idPrefix}-alias`} validationState={this.state.errors['alias'] ? 'error' : null}>
              <LabelCol sm={3}>
                { msg.diskEditorAliasLabel() }
              </LabelCol>
              <Col sm={9}>
                <FormControl
                  type='text'
                  defaultValue={this.state.values.alias}
                  onChange={this.changeAlias}
                />
                {this.state.errors['alias'] && <HelpBlock>{this.state.errors['alias']}</HelpBlock>}
              </Col>
            </FormGroup>

            {/* Size Display (for edit mode) */}
            { !createMode &&
            <FormGroup controlId={`${idPrefix}-size`}>
              <LabelCol sm={3}>
                { msg.diskEditorSizeEditLabel() }
                { !isImage &&
                  <InfoTooltip id={`${idPrefix}-size-tooltip`} tooltip={msg.diskEditorSizeCantChangeHelp()} />
                }
              </LabelCol>
              <Col sm={9}>
                <div id={`${idPrefix}-size`} className={style['editor-field-read-only']}>
                  { diskSize / 1024 ** 3 }
                </div>
              </Col>
            </FormGroup>
            }

            {/* Size Editor (initial size for create, expand by size for edit) */}
            { (createMode || isImage) &&
            <FormGroup controlId={`${idPrefix}-size-edit`}>
              <LabelCol sm={3}>
                { createMode &&
                  <React.Fragment>
                    {msg.diskEditorSizeLabel()}
                    <InfoTooltip id={`${idPrefix}-size-edit-tooltip`} tooltip={msg.diskEditorSizeCreateInfoTooltip()} />
                  </React.Fragment>
                }
                { !createMode && msg.diskEditorResizeLabel() }
              </LabelCol>
              <Col sm={2}>
                { createMode &&
                  <FormControl
                    type='number'
                    value={this.state.values.size}
                    onChange={this.changeSize}
                  />
                }
                { !createMode &&
                  <Tooltip id={`${idPrefix}-form-tooltip`} tooltip={msg.diskEditorResizeNote()} placement='right'>
                    <FormControl
                      type='number'
                      value={this.state.values.size}
                      onChange={this.changeSize}
                    />
                  </Tooltip>
                }
              </Col>
            </FormGroup>
            }

            {/* Storage Domain */}
            <FormGroup controlId={`${idPrefix}-storage-domain`}>
              <LabelCol sm={3}>
                { msg.diskEditorStorageDomainLabel() }
                <InfoTooltip
                  id={`${idPrefix}-storage-domain-edit-tooltip`}
                  tooltip={
                    createMode
                      ? msg.diskEditorStorageDomainCreateHelp()
                      : msg.diskEditorStorageDomainCantChangeHelp()
                  }
                />
              </LabelCol>
              <Col sm={9}>
                { createMode &&
                  <SelectBox
                    id={`${idPrefix}-storage-domain`}
                    items={this.state.storageDomainSelectList}
                    selected={this.state.values.storageDomain}
                    onChange={this.changeStorageDomain}
                  />
                }
                { !createMode && !isDirectLUN &&
                  <div id={`${idPrefix}-storage-domain`} className={style['editor-field-read-only']}>
                    {
                      this.props.storageDomains.getIn([this.state.values.storageDomain, 'name']) ||
                      msg.diskEditorStorageDomainNotAvailable()
                    }
                  </div>
                }
                { isDirectLUN &&
                  <div id={`${idPrefix}-storage-domain`} className={style['editor-field-read-only']}>
                    { msg.diskEditorStorageDomainNotAvailable() }
                  </div>
                }
              </Col>
            </FormGroup>

            {/* Disk Type (thin vs preallocated) */}
            <FormGroup controlId={`${idPrefix}-format`}>
              <LabelCol sm={3}>
                { msg.diskEditorDiskTypeLabel() }
                <InfoTooltip
                  id={`${idPrefix}-format-tooltip`}
                  tooltip={
                    createMode
                      ? msg.diskEditorDiskTypeCreateHelp()
                      : msg.diskEditorDiskTypeCantChangeHelp()
                  }
                />
              </LabelCol>
              <Col sm={9}>
                { createMode &&
                  <SelectBox
                    id={`${idPrefix}-format`}
                    items={DISK_TYPES}
                    selected={this.state.values.diskType}
                    onChange={this.changeDiskType}
                  />
                }
                { !createMode && !isDirectLUN &&
                  <div id={`${idPrefix}-format`} className={style['editor-field-read-only']}>
                    { this.state.values.diskType === 'pre' && msg.diskEditorDiskTypeOptionPre() }
                    { this.state.values.diskType === 'thin' && msg.diskEditorDiskTypeOptionThin() }
                  </div>
                }
                { isDirectLUN &&
                  <div id={`${idPrefix}-format`} className={style['editor-field-read-only']}>
                    { msg.diskEditorDiskTypeNotAvailable() }
                  </div>
                }
              </Col>
            </FormGroup>

            {/* Disk Bootable */}
            <FormGroup controlId={`${idPrefix}-bootable`}>
              <LabelCol sm={3}>
                { msg.diskEditorBootableLabel() }
                {!vmIsDown &&
                  <InfoTooltip
                    id={`${idPrefix}-bootable-edit-tooltip`}
                    tooltip={msg.bootableEditTooltip()}
                  />
                }
              </LabelCol>
              <Col sm={9}>
                <Checkbox
                  checked={this.state.values.bootable}
                  onChange={this.changeBootable}
                  id={`${idPrefix}-bootable`}
                  disabled={!vmIsDown}
                />
              </Col>
            </FormGroup>
            { showBootableChangeAlert &&
              <FormGroup controlId={`${idPrefix}-bootable`} className={style['editor-bootable-alert-container']}>
                <Col sm={3} />
                <Col sm={9}>
                  <Alert
                    className={style['editor-bootable-alert']}
                    isInline
                    variant='warning'
                    title={msg.diskEditorBootableChangeMessage({ diskName: currentBootableDisk.get('name') })}
                  />
                </Col>
              </FormGroup>
            }
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            id={`${idPrefix}-modal-cancel`}
            bsStyle='default'
            className='btn-cancel'
            onClick={this.close}
          >
            { msg.cancel() }
          </Button>
          <Button
            id={`${idPrefix}-modal-ok`}
            bsStyle='primary'
            onClick={this.handleSave}
            disabled={!this.isFormValid()}
          >
            { msg.ok() }
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
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
    dataCenterId: state.clusters.getIn([ vm.getIn([ 'cluster', 'id' ]), 'dataCenterId' ]),
  })
)(withMsg(DiskImageEditor))
