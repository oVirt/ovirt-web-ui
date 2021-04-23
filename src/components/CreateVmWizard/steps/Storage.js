import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { MsgContext, withMsg } from '_/intl'
import { generateUnique } from '_/helpers'
import { isNumber, convertValue } from '_/utils'
import { BASIC_DATA_SHAPE, STORAGE_SHAPE } from '../dataPropTypes'

import {
  createDiskTypeList,
  createStorageDomainList,
  sortNicsDisks,
  suggestDiskName,
  isDiskNameValid,
} from '_/components/utils'

import {
  Button,
  Checkbox,
  DropdownKebab,
  EmptyState,
  FormGroup,
  FormControl,
  HelpBlock,
  MenuItem,
  Table,
  Label,
} from 'patternfly-react'
import _TableInlineEditRow from './_TableInlineEditRow'
import SelectBox from '_/components/SelectBox'

import style from './style.css'
import { Tooltip, InfoTooltip } from '_/components/tooltips'

export const DiskNameWithLabels = ({ id, disk }) => {
  const { msg } = useContext(MsgContext)
  const idPrefix = `${id}-disk-${disk.id}`
  return <React.Fragment>
    <span id={`${idPrefix}-name`}>{ disk.name }</span>
    { disk.isFromTemplate &&
      <Tooltip id={`${idPrefix}-template-defined-badge`} tooltip={msg.templateDefined()}>
        <Label id={`${idPrefix}-from-template`} className={`${style['disk-label']}`}>
          T
        </Label>
      </Tooltip>
    }
    { disk.bootable &&
      <Label id={`${idPrefix}-bootable`} className={style['disk-label']} bsStyle='info'>
        { msg.diskLabelBootable() }
      </Label>
    }
  </React.Fragment>
}
DiskNameWithLabels.propTypes = {
  id: PropTypes.string,
  disk: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    isFromTemplate: PropTypes.bool,
    bootable: PropTypes.bool,
  }),
}

/**
 * The disks table cannot be completely a controlled component, some state about rows being
 * edited needs to be held within the component.  Right now only the fact that a row is
 * being edited is being tracked in component state.
 *
 * Input field editing in the table have the same restrictions as the nics table.
 */
class Storage extends React.Component {
  constructor (props) {
    super(props)
    this.handleCellChange = this.handleCellChange.bind(this)
    this.handleTemplateDiskStorageDomainChange = this.handleTemplateDiskStorageDomainChange.bind(this)
    this.handleRowCancelChange = this.handleRowCancelChange.bind(this)
    this.handleRowConfirmChange = this.handleRowConfirmChange.bind(this)
    this.removeEditState = this.removeEditState.bind(this)
    this.onCreateDisk = this.onCreateDisk.bind(this)
    this.onDeleteDisk = this.onDeleteDisk.bind(this)
    this.onEditDisk = this.onEditDisk.bind(this)
    this.rowRenderProps = this.rowRenderProps.bind(this)
    this.bootableInfo = this.bootableInfo.bind(this)
    this.isBootableDiskTemplate = this.isBootableDiskTemplate.bind(this)
    this.isEditingMode = this.isEditingMode.bind(this)
    this.isValidDiskSize = this.isValidDiskSize.bind(this)

    props.onUpdate({ valid: this.validateTemplateDiskStorageDomains() })

    const { msg } = this.props

    this.state = {
      editingErrors: {
        diskInvalidName: false,
      },
      editing: {},
      creating: false,
    }

    const {
      id: idPrefix = 'create-vm-wizard-storage',
    } = this.props

    // ---- Table Row Editing Controller
    this.inlineEditController = {
      isEditing: ({ rowData, column, property }) => this.state.editing[rowData.id] !== undefined,
      onActivate: ({ rowData }) => this.onEditDisk(rowData),
      onConfirm: ({ rowData }) => this.handleRowConfirmChange(rowData),
      onCancel: ({ rowData }) => this.handleRowCancelChange(rowData),
    }

    // ----- Table Cell Renderers
    const headerFormatText = (label, { column }) => <Table.Heading {...column.header.props}>{label}</Table.Heading>

    const inlineEditFormatter = Table.inlineEditFormatterFactory({
      isEditing: additionalData => this.inlineEditController.isEditing(additionalData),

      renderValue: (value, additionalData) => {
        const { column } = additionalData

        return (
          <Table.Cell>
            { column.valueView ? column.valueView(value, additionalData) : value }
          </Table.Cell>
        )
      },

      renderEdit: (value, additionalData) => {
        const { column } = additionalData
        return (
          <Table.Cell className='editable editing'>
            { column.editView ? column.editView(value, additionalData) : value }
          </Table.Cell>
        )
      },
    })

    // ---- Table Column Definitions
    this.columns = [
      // name
      {
        header: {
          label: msg.createVmStorageTableHeaderName(),
          formatters: [headerFormatText],
          props: {
            style: {
              width: '30%',
            },
          },
        },
        cell: {
          formatters: [inlineEditFormatter],
        },
        valueView: (value, { rowData }) => {
          return <DiskNameWithLabels id={idPrefix} disk={rowData} />
        },
        editView: (value, { rowData }) => {
          const row = this.state.editing[rowData.id]
          const { diskInvalidName } = this.state.editingErrors

          return row.isFromTemplate
            ? this.columns[0].valueView(value, { rowData })
            : (
              <FormGroup
                validationState={diskInvalidName ? 'error' : null}
                className={style['form-group-edit']}
              >
                <FormControl
                  id={`${idPrefix}-${value}-name-edit`}
                  type='text'
                  defaultValue={row.name}
                  onChange={e => this.handleCellChange(rowData, 'name', e.target.value)}
                />
                {diskInvalidName &&
                  <HelpBlock>{msg.diskNameValidationRules()}</HelpBlock>
                }
              </FormGroup>
            )
        },
      },

      // Bootable column - displayed only when editing disk
      // Note: only one disk can be bootable at a time
      {
        header: {
          label: msg.createVmStorageTableHeaderBootable(),
          formatters: [(...formatArgs) => this.isEditingMode() && headerFormatText(...formatArgs)],
          props: {
            style: {
              width: '5%',
            },
          },
        },
        cell: {
          formatters: [(...formatArgs) => this.isEditingMode() && inlineEditFormatter(...formatArgs)],
        },
        valueView: null,
        editView: (value, { rowData }) => {
          return <div className={style['disk-bootable-edit']}>
            { !this.isBootableDiskTemplate() &&
              <Checkbox
                aria-label='bootable checkbox'
                checked={this.state.editing[rowData.id].bootable}
                id={`${idPrefix}-bootable`}
                onChange={e => this.handleCellChange(rowData, 'bootable', e.target.checked)}
                title='Bootable flag'
              />
            }
            <div className={style['bootable-info-tooltip']}>
              <InfoTooltip
                id={`${idPrefix}-bootable-tooltip`}
                tooltip={this.bootableInfo(rowData.bootable)}
              />
            </div>
          </div>
        },
      },

      // size
      {
        header: {
          label: msg.createVmStorageTableHeaderSize(),
          formatters: [headerFormatText],
          props: {
            style: {
              width: '15%',
            },
          },
        },
        cell: {
          formatters: [inlineEditFormatter],
        },
        valueView: (value, { rowData }) => {
          return <React.Fragment>
            { rowData.sized.value } { rowData.sized.unit }
          </React.Fragment>
        },
        editView: (value, { rowData }) => {
          const row = this.state.editing[rowData.id]
          const sizeGiB = row.size / (1024 ** 3)

          return <div className={style['disk-size-edit']}>
            <div>
              <FormControl
                id={`${idPrefix}-${value}-size-edit`}
                type='number'
                step={1}
                value={sizeGiB}
                className={style['disk-size-form-control-edit']}
                onChange={e => this.handleCellChange(rowData, 'size', e.target.value)}
              />
            </div>
            <span className={style['disk-size-edit-label']}>GiB</span>
            <div>
              <InfoTooltip id={`${idPrefix}-${value}-size-edit-info-tooltip`} tooltip={msg.diskEditorSizeCreateInfoTooltip()} />
            </div>
          </div>
        },
      },

      // storage domain
      {
        header: {
          label: msg.createVmStorageTableHeaderStorageDomain(),
          formatters: [headerFormatText],
          props: {
            style: {
              width: '25%',
            },
          },
        },
        cell: {
          formatters: [inlineEditFormatter],
        },
        valueView: (value, { rowData }) => {
          const {
            storageDomainId: id,
            storageDomain: sd,
            canUserUseStorageDomain,
            isFromTemplate,
          } = rowData

          if (isFromTemplate && !canUserUseStorageDomain) {
            const { storageDomains, dataCenterId, locale } = props
            const storageDomainList = createStorageDomainList({ storageDomains, dataCenterId, includeUsage: true, locale, msg })

            if (storageDomainList.length === 0) {
              return <React.Fragment>
                {msg.createVmStorageNoStorageDomainAvailable()}
                <InfoTooltip
                  id={`${idPrefix}-${rowData.id}-storage-domain-na-tooltip`}
                  tooltip={msg.createVmStorageNoStorageDomainAvailableTooltip()}
                />
              </React.Fragment>
            } else {
              if (!sd.isOk) {
                storageDomainList.unshift({ id: '_', value: `-- ${msg.createVmStorageSelectStorageDomain()} --` })
              }

              return <SelectBox
                id={`${idPrefix}-${rowData.id}-storage-domain-edit`}
                items={storageDomainList}
                selected={sd.isOk ? rowData.storageDomainId : '_'}
                validationState={!sd.isOk && 'error'}
                onChange={value => this.handleTemplateDiskStorageDomainChange(rowData, value)}
              />
            }
          }

          return <React.Fragment>
            { id === '_'
              ? `-- ${msg.createVmStorageSelectStorageDomain()} --`
              : sd.isOk
                ? sd.name
                : msg.createVmStorageUnknownStorageDomain()
            }
          </React.Fragment>
        },
        editView: (value, { rowData }) => {
          const { storageDomains, dataCenterId, locale } = props
          const storageDomainList = createStorageDomainList({ storageDomains, dataCenterId, includeUsage: true, locale, msg })
          const row = this.state.editing[rowData.id]

          if (storageDomainList.length > 1 || row.storageDomainId === '_') {
            storageDomainList.unshift({ id: '_', value: `-- ${msg.createVmStorageSelectStorageDomain()} --` })
          }

          return (
            <SelectBox
              id={`${idPrefix}-${value}-storage-domain-edit`}
              items={storageDomainList}
              selected={row.storageDomainId}
              onChange={value => this.handleCellChange(rowData, 'storageDomainId', value)}
              validationState={row.storageDomainId === '_' && 'error'}
            />
          )
        },
      },

      // disk type (thin/sparse/cow vs preallocated/raw)
      {
        header: {
          label: msg.createVmStorageTableHeaderType(),
          formatters: [headerFormatText],
          props: {
            style: {
              width: '20%',
            },
          },
        },
        property: 'diskTypeLabel',
        cell: {
          formatters: [inlineEditFormatter],
        },
        editView: (value, { rowData }) => {
          const row = this.state.editing[rowData.id]

          const typeList = createDiskTypeList(msg)
          if (!row.diskType || row.diskType === '_') {
            typeList.unshift({ id: '_', value: `-- ${msg.createVmStorageSelectDiskType()} --` })
          }

          return (
            <SelectBox
              id={`${idPrefix}-${value}-diskType-edit`}
              items={typeList}
              selected={row.diskType || '_'}
              onChange={value => this.handleCellChange(rowData, 'diskType', value)}
            />
          )
        },
      },

      // actions
      {
        header: {
          label: '',
          formatters: [headerFormatText],

          props: {
            style: {
              width: '20px',
            },
          },
        },
        type: 'actions',
        cell: {
          formatters: [
            (value, { rowData, rowIndex }) => {
              const hideKebab = this.state.creating === rowData.id
              const actionsDisabled = !!this.state.creating || this.isEditingMode() || rowData.isFromTemplate
              const templateDefined = rowData.isFromTemplate
              const kebabId = `${idPrefix}-kebab-${rowData.name}`

              return <React.Fragment>
                { hideKebab && <Table.Cell /> }

                { templateDefined &&
                  <Table.Cell className={style['disk-from-template']}>
                    <InfoTooltip id={`${kebabId}-info-tooltip`} tooltip={msg.createVmStorageNoEditHelpMessage()} />
                  </Table.Cell>
                }

                { !hideKebab && !templateDefined &&
                  <Table.Cell className={style['kebab-menu-cell']}>
                    <Tooltip id={`tooltip-${kebabId}`} tooltip={msg.createVmStorageEditActions()} placement={'bottom'}>
                      <div className={style['kebab-menu-wrapper']}>
                        <DropdownKebab
                          id={kebabId}
                          className={style['action-kebab']}
                          pullRight
                        >
                          <MenuItem
                            id={`${kebabId}-edit`}
                            onSelect={() => { this.inlineEditController.onActivate({ rowIndex, rowData }) }}
                            disabled={actionsDisabled}
                          >
                            {msg.edit()}
                          </MenuItem>
                          <MenuItem
                            id={`${kebabId}-delete`}
                            onSelect={() => { this.onDeleteDisk(rowData) }}
                            disabled={actionsDisabled}
                          >
                            {msg.delete()}
                          </MenuItem>
                        </DropdownKebab>
                      </div>
                    </Tooltip>
                  </Table.Cell>
                }
              </React.Fragment>
            },
          ],
        },
      },
    ]
  }

  // return boolean value to answer if we are editing a Disk or not
  isEditingMode () {
    return Object.keys(this.state.editing).length > 0
  }

  // return true if the VM has any template disks that are set bootable
  isBootableDiskTemplate () {
    const bootableTemplateDisks = this.props.disks
      .filter(disk => disk.isFromTemplate && disk.bootable)

    return bootableTemplateDisks.length > 0
  }

  // set appropriate tooltip message regarding setting bootable flag
  bootableInfo (isActualDiskBootable) {
    const { msg } = this.props
    const bootableDisk = this.props.disks.find(disk => disk.bootable)

    if (this.isBootableDiskTemplate()) {
      // template based disk cannot be edited so bootable flag cannot be removed from it
      return msg.createVmStorageNoEditBootableMessage({ diskName: bootableDisk.name })
    } else if (bootableDisk && !isActualDiskBootable) {
      // actual bootable disk isn't template based or the disk which is being edited, moving bootable flag from the bootable disk allowed
      return msg.diskEditorBootableChangeMessage({ diskName: bootableDisk.name })
    }

    // no any bootable disk yet (or the disk which is being edited is bootable but not a template disk), adding/editing bootable flag allowed
    return msg.createVmStorageBootableMessage()
  }

  validateTemplateDiskStorageDomains ({ update, ignoreId } = {}) {
    const { disks, storageDomains } = this.props
    let disksAreValid = true

    const templateDisks = disks.filter(disk => disk.isFromTemplate)
    for (let i = 0; disksAreValid && i < templateDisks.length; i++) {
      let disk = templateDisks[i]
      if (disk.id === ignoreId) {
        continue
      }
      if (update && update.id === disk.id) {
        disk = { ...disk, ...update }
      }
      disksAreValid = disksAreValid && storageDomains.getIn([ disk.storageDomainId, 'canUserUseDomain' ], false)
    }

    return disksAreValid
  }

  onCreateDisk () {
    const newId = generateUnique('NEW_')
    const {
      minDiskSizeInGiB: diskInitialSizeInGib,
      storageDomains,
      dataCenterId,
      vmName,
      disks,
      locale,
      msg,
    } = this.props

    // If only 1 storage domain is available, select it automatically
    const storageDomainList = createStorageDomainList({ storageDomains, dataCenterId, locale, msg })
    const storageDomainId = storageDomainList.length === 1 ? storageDomainList[0].id : '_'

    // Setup a new disk in the editing hash
    this.setState(state => ({
      creating: newId,
      editing: {
        ...state.editing,
        [newId]: {
          id: newId,
          name: suggestDiskName(vmName, disks),

          diskId: '_',
          storageDomainId,

          bootable: false,
          iface: 'virtio_scsi',
          type: 'image',
          diskType: 'thin',

          size: (diskInitialSizeInGib * 1024 ** 3),
        },
      },
    }))
    this.props.onUpdate({ valid: false }) // the step isn't valid until Create is done
  }

  onEditDisk (rowData) {
    this.setState(state => ({
      editing: {
        ...state.editing,
        [rowData.id]: rowData,
      },
    }))
    this.props.onUpdate({ valid: false }) // the step isn't valid until Edit is done
  }

  onDeleteDisk (rowData) {
    this.props.onUpdate({
      valid: this.validateTemplateDiskStorageDomains({ ignoreId: rowData.id }),
      remove: rowData.id,
    })
  }

  isValidDiskSize (size) {
    const { minDiskSizeInGiB, maxDiskSizeInGiB } = this.props
    return isNumber(size) && size >= minDiskSizeInGiB && size <= maxDiskSizeInGiB
  }

  handleCellChange (rowData, field, value) {
    const editingRow = this.state.editing[rowData.id]
    const editingErrors = {}
    switch (field) {
      case 'size':
        if (!this.isValidDiskSize(value)) return
        value = +value * (1024 ** 3) // GiB to B
        break
      case 'name':
        editingErrors.diskInvalidName = !isDiskNameValid(value)
        break
    }

    if (editingRow) {
      editingRow[field] = value
      this.setState(state => ({
        editingErrors: {
          ...state.editingErrors,
          ...editingErrors,
        },
        editing: {
          ...state.editing,
          [rowData.id]: editingRow,
        },
      }))
    }
  }

  handleTemplateDiskStorageDomainChange (rowData, storageDomainId) {
    const update = { id: rowData.id, storageDomainId }
    this.props.onUpdate({
      valid: this.validateTemplateDiskStorageDomains({ update }),
      update,
    })
  }

  // Verify changes, and if valid, push the new or editing row up via __onUpdate__
  handleRowConfirmChange (rowData) {
    const { creating, editing, editingErrors } = this.state
    const actionCreate = !!creating && creating === rowData.id
    const editedRow = editing[rowData.id]

    if (Object.values(editingErrors).find(val => val) || editedRow.storageDomainId === '_') return

    // if the edited disk is set bootable, make sure to remove bootable from the other disks
    if (editedRow.bootable) {
      const previousBootableDisk = this.props.disks.find(disk => disk.bootable)
      if (previousBootableDisk) {
        this.props.onUpdate({
          update: { id: previousBootableDisk.id, bootable: false },
        })
      }
    }

    this.props.onUpdate({
      [actionCreate ? 'create' : 'update']: editedRow,
      valid: this.validateTemplateDiskStorageDomains(), // don't need to update changes on non-template disks
    })
    this.removeEditState(rowData.id)
  }

  // Cancel the creation or editing of a row by throwing out edit state
  handleRowCancelChange (rowData) {
    this.props.onUpdate({ valid: this.validateTemplateDiskStorageDomains() })
    this.removeEditState(rowData.id)
  }

  // Drop table edit state
  removeEditState (rowId) {
    this.components = undefined // forces the table to reload
    this.setState(state => {
      const editing = state.editing
      delete editing[rowId]
      return {
        editingErrors: {
          diskInvalidName: false,
        },
        creating: false,
        editing,
      }
    })
  }

  // Create props for each row that will be passed to the row component (TableInlineEditRow)
  rowRenderProps (nicList, rowData, { rowIndex }) {
    const actionButtonsTop =
      rowIndex > 5 &&
      rowIndex === nicList.length - 1

    return {
      role: 'row',

      isEditing: () => this.inlineEditController.isEditing({ rowData }),
      onConfirm: () => this.inlineEditController.onConfirm({ rowData, rowIndex }),
      onCancel: () => this.inlineEditController.onCancel({ rowData, rowIndex }),
      last: actionButtonsTop, // last === if the confirm/cancel buttons should go above the row
    }
  }

  render () {
    const {
      id: idPrefix = 'create-vm-wizard-disks',
      storageDomains,
      disks,
      dataCenterId,
      msg,
      locale,
    } = this.props

    const storageDomainList = createStorageDomainList({ storageDomains, locale, msg })
    const dataCenterStorageDomainsList = createStorageDomainList({ storageDomains, dataCenterId, locale, msg })
    const enableCreate = storageDomainList.length > 0 && !this.isEditingMode()

    const diskList = sortNicsDisks([...disks], locale)
      .concat(this.state.creating ? [ this.state.editing[this.state.creating] ] : [])
      .map(disk => {
        disk = this.state.editing[disk.id] || disk
        const sd = storageDomainList.find(sd => sd.id === disk.storageDomainId)
        const isSdOk = !!sd && (
          disk.canUserUseStorageDomain ||
          dataCenterStorageDomainsList.find(sd => sd.id === disk.storageDomainId)
        )

        return {
          ...disk,

          // compose raw disk info to be used for table render data
          sized: convertValue('B', disk.size),
          storageDomain: {
            isOk: isSdOk,
            name: sd && sd.value,
          },
          diskTypeLabel: disk.diskType === 'thin' ? msg.diskEditorDiskTypeOptionThin()
            : disk.diskType === 'pre' ? msg.diskEditorDiskTypeOptionPre()
              : disk.diskType,
        }
      })

    // reuse _TableInlineEditRow to allow for normal form behavior (keyboard navigation
    // and using onChange field handlers)
    this.components = this.components || {
      body: {
        row: _TableInlineEditRow,
      },
    }

    return <div className={style['settings-container']} id={idPrefix}>
      { diskList.length === 0 && <React.Fragment>
        <EmptyState>
          <EmptyState.Icon />
          <EmptyState.Title>{msg.createVmStorageEmptyTitle()}</EmptyState.Title>
          <EmptyState.Info>{msg.createVmStorageEmptyInfo()}</EmptyState.Info>
          { enableCreate &&
            <EmptyState.Action>
              <Button bsStyle='primary' bsSize='large' onClick={this.onCreateDisk}>
                {msg.diskActionCreateNew()}
              </Button>
            </EmptyState.Action>
          }
          { !enableCreate &&
            <EmptyState.Help>
              {msg.diskNoCreate()}
            </EmptyState.Help>
          }
        </EmptyState>
      </React.Fragment> }

      { diskList.length > 0 && <React.Fragment>
        <div className={style['action-buttons']}>
          <Button bsStyle='default' disabled={!enableCreate} onClick={this.onCreateDisk}>
            {msg.diskActionCreateNew()}
          </Button>
        </div>
        <div className={style['disk-table']}>
          <Table.PfProvider
            striped
            bordered
            hover
            dataTable
            inlineEdit
            columns={this.columns}
            components={this.components}
          >
            <Table.Header />
            <Table.Body
              rows={diskList}
              rowKey='id'
              onRow={(...rest) => this.rowRenderProps(diskList, ...rest)}
            />
          </Table.PfProvider>
        </div>
      </React.Fragment> }
    </div>
  }
}

Storage.propTypes = {
  id: PropTypes.string,
  vmName: BASIC_DATA_SHAPE.name.isRequired,
  optimizedFor: BASIC_DATA_SHAPE.optimizedFor,
  disks: PropTypes.arrayOf(PropTypes.shape(STORAGE_SHAPE)).isRequired,

  clusterId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  dataCenterId: PropTypes.string.isRequired,

  cluster: PropTypes.object.isRequired,
  storageDomains: PropTypes.object.isRequired,
  maxDiskSizeInGiB: PropTypes.number.isRequired,
  minDiskSizeInGiB: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  (state, { clusterId }) => ({
    cluster: state.clusters.get(clusterId),
    storageDomains: state.storageDomains,
    maxDiskSizeInGiB: 4096, // TODO: 4TiB, no config option pulled as of 2019-Mar-22
    minDiskSizeInGiB: 1,
  })
)(withMsg(Storage))
