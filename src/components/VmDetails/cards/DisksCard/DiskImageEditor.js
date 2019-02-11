import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { msg } from '../../../../intl'
import { localeCompare } from '../../../../helpers'
import { isNumber } from '../../../../utils'

import {
  Button,
  Col,
  ControlLabel,
  FieldLevelHelp,
  Form,
  FormControl,
  FormGroup,
  Modal,
} from 'patternfly-react'
import SelectBox from '../../../SelectBox'
import style from './style.css'

const DISK_DEFAULTS = {
  active: true,
  bootable: false,
  iface: 'virtio_scsi', // virtio | virtio_scsi

  id: undefined,
  name: '',
  type: 'image',
  format: 'cow', // cow | raw
  sparse: true,

  provisionedSize: 1 * 1024 ** 3,
}

function storageDomainsToSelectList (storageDomainList) {
  return storageDomainList
    .filter(storageDomain => storageDomain.get('canUserUseDomain'))
    .map(
      item => ({
        id: item.get('id'),
        value: item.get('name'),
      })
    )
    .sort((a, b) => localeCompare(a.value, b.value))
    .toJS()
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
 *   - Disk Image Format (Allocation Policy ... Thin Provision vs Preallocated)
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
    this.state = {
      showModal: false,
      storageDomainSelectList: storageDomainsToSelectList(props.storageDomainList),

      id: undefined,
      alias: props.suggestedName || '',
      size: DISK_DEFAULTS.provisionedSize / 1024 ** 3,
      storageDomain: props.suggestedStorageDomain || '',
      format: DISK_DEFAULTS.format, // cow vs raw .. Allocation Policy (thin sparse vs preallocated !sparse)?
    }
    this.changesMade = false

    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.composeNic = this.composeDisk.bind(this)
    this.handleSave = this.handleSave.bind(this)

    this.changeAlias = this.changeAlias.bind(this)
    this.changeSize = this.changeSize.bind(this)
    this.changeStorageDomain = this.changeStorageDomain.bind(this)
    this.changeFormat = this.changeFormat.bind(this)
  }

  open (e) {
    e.preventDefault()
    const { disk, suggestedName, suggestedStorageDomain } = this.props
    const { storageDomainSelectList } = this.state

    const diskInfo = disk
      ? { // edit
        id: disk.get('id'),
        alias: disk.get('name'),
        size: 0,
        storageDomain: disk.get('storageDomainId'),
        format: disk.get('format'),
      }
      : { // new
        id: undefined,
        alias: suggestedName,
        size: DISK_DEFAULTS.provisionedSize / 1024 ** 3,
        storageDomain:
          (/\w+/.test(suggestedStorageDomain) && suggestedStorageDomain) ||
          (storageDomainSelectList.length > 0 && storageDomainSelectList[0].id) ||
          '',
        format: DISK_DEFAULTS.format,
      }

    this.setState({
      showModal: true,
      storageDomainSelectList: storageDomainsToSelectList(this.props.storageDomainList),
      ...diskInfo,
    })
    this.changesMade = false
  }

  close () {
    this.setState({ showModal: false })
  }

  composeDisk () {
    const { vm, disk } = this.props

    const vmDiskInSameStorageDomain =
      vm.get('disks') &&
      vm.get('disks').find(disk => disk.get('storageDomainId') === this.state.storageDomain)

    const iface =
      (disk && disk.get('iface')) ||
      (vmDiskInSameStorageDomain && vmDiskInSameStorageDomain.get('iface')) ||
      'virtio_scsi'

    const provisionedSize = disk
      ? disk.get('provisionedSize') + this.state.size * 1024 ** 3
      : this.state.size * 1024 ** 3

    const newDisk = {
      ...DISK_DEFAULTS,
      attachmentId: disk && disk.get('attachmentId'),

      iface,

      id: this.state.id,
      name: this.state.alias,
      provisionedSize,
      storageDomainId: this.state.storageDomain,
      format: this.state.format,
      sparse: this.state.format === 'cow',
    }

    if (disk && disk.get('type') !== 'image') {
      newDisk.type = disk.get('type')
      newDisk.provisionedSize = undefined
    }

    return newDisk
  }

  handleSave () {
    if (!this.props.disk || this.changesMade) {
      const newDisk = this.composeDisk()
      this.props.onSave(this.props.vm.get('id'), newDisk)
    }
    this.close()
  }

  changeAlias ({ target: { value } }) {
    this.setState({ alias: value })
    this.changesMade = true
  }

  changeSize ({ target: { value } }) {
    if (isNumber(value) && value >= 0) {
      this.setState({ size: value })
      this.changesMade = true
    }
  }

  changeStorageDomain (value) {
    this.setState({ storageDomain: value })
    this.changesMade = true
  }

  changeFormat (value) {
    this.setState({ format: value })
    this.changesMade = true
  }

  render () {
    const { idPrefix, disk, trigger } = this.props

    const createMode = !disk
    const isImage = disk && disk.get('type') === 'image'
    const isDirectLUN = disk && disk.get('type') === 'lun'

    const diskSize = disk && (disk.get('lunSize') ? disk.get('lunSize') : disk.get('provisionedSize'))

    return <React.Fragment>
      {React.cloneElement(trigger, { onClick: this.open })}

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

          <Form horizontal>
            {/* Alias */}
            <FormGroup controlId={`${idPrefix}-alias`} className={createMode && 'required'}>
              <LabelCol sm={3}>
                { msg.diskEditorAliasLabel() }
              </LabelCol>
              <Col sm={9}>
                <FormControl
                  type='text'
                  defaultValue={this.state.alias}
                  onChange={this.changeAlias}
                />
              </Col>
            </FormGroup>

            {/* Size Display (for edit mode) */}
            { !createMode &&
            <FormGroup controlId={`${idPrefix}-size`}>
              <LabelCol sm={3}>
                { msg.diskEditorSizeLabel() }
                { !isImage &&
                  <FieldLevelHelp
                    inline
                    content={msg.diskEditorSizeCantChangeHelp()}
                    buttonClass={style['editor-field-help']}
                  />
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
            <FormGroup controlId={`${idPrefix}-size-edit`} className={createMode && 'required'}>
              <LabelCol sm={3}>
                { createMode &&
                  <React.Fragment>
                    {msg.diskEditorSizeLabel()}
                    <FieldLevelHelp
                      inline
                      content={msg.diskEditorSizeCreateHelp()}
                      buttonClass={style['editor-field-help']}
                    />
                  </React.Fragment>
                }
                { !createMode && msg.diskEditorResizeLabel() }
              </LabelCol>
              <Col sm={9}>
                <FormControl
                  type='number'
                  value={this.state.size}
                  onChange={this.changeSize}
                />
              </Col>
            </FormGroup>
            }

            {/* Storage Domain */}
            <FormGroup controlId={`${idPrefix}-storage-domain`} className={createMode && 'required'}>
              <LabelCol sm={3}>
                { msg.diskEditorStorageDomainLabel() }
                <FieldLevelHelp
                  inline
                  content={
                    createMode
                      ? msg.diskEditorStorageDomainCreateHelp()
                      : msg.diskEditorStorageDomainCantChangeHelp()
                  }
                  buttonClass={style['editor-field-help']}
                />
              </LabelCol>
              <Col sm={9}>
                { createMode &&
                  <SelectBox
                    id={`${idPrefix}-storage-domain`}
                    items={this.state.storageDomainSelectList}
                    selected={this.state.storageDomain}
                    onChange={this.changeStorageDomain}
                  />
                }
                { !createMode && !isDirectLUN &&
                  <div id={`${idPrefix}-storage-domain`} className={style['editor-field-read-only']}>
                    {
                      this.props.storageDomains.getIn([this.state.storageDomain, 'name']) ||
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

            {/* Disk Format */}
            <FormGroup controlId={`${idPrefix}-format`} className={createMode && 'required'}>
              <LabelCol sm={3}>
                { msg.diskEditorFormatLabel() }
                <FieldLevelHelp
                  inline
                  content={
                    createMode
                      ? msg.diskEditorFormatCreateHelp()
                      : msg.diskEditorFormatCantChangeHelp()
                  }
                  buttonClass={style['editor-field-help']}
                />
              </LabelCol>
              <Col sm={9}>
                { createMode &&
                  <SelectBox
                    id={`${idPrefix}-format`}
                    items={[
                      { id: 'raw', value: msg.diskEditorFormatOptionRaw() },
                      { id: 'cow', value: msg.diskEditorFormatOptionCow() },
                    ]}
                    selected={this.state.format}
                    onChange={this.changeFormat}
                  />
                }
                { !createMode && !isDirectLUN &&
                  <div id={`${idPrefix}-format`} className={style['editor-field-read-only']}>
                    { this.state.format === 'raw' && msg.diskEditorFormatOptionRaw() }
                    { this.state.format === 'cow' && msg.diskEditorFormatOptionCow() }
                  </div>
                }
                { isDirectLUN &&
                  <div id={`${idPrefix}-format`} className={style['editor-field-read-only']}>
                    { msg.diskEditorFormatNotAvailable() }
                  </div>
                }
              </Col>
            </FormGroup>
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
  trigger: PropTypes.element.isRequired,
  onSave: PropTypes.func.isRequired,

  storageDomains: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    storageDomains: state.storageDomains,
  })
)(DiskImageEditor)
