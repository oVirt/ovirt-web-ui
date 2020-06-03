import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { msg, enumMsg } from '_/intl'
import { generateUnique } from '_/helpers'
import { NIC_SHAPE } from '../dataPropTypes'

import {
  createNicInterfacesList,
  createVNicProfileList,
  sortNicsDisks,
  suggestNicName,
} from '_/components/utils'

import {
  Button,
  DropdownKebab,
  EmptyState,
  FieldLevelHelp,
  FormControl,
  Label,
  MenuItem,
  Table,
} from 'patternfly-react'
import _TableInlineEditRow from './_TableInlineEditRow'
import SelectBox from '_/components/SelectBox'

import style from './style.css'
import OverlayTooltip from '_/components/OverlayTooltip'
import { EMPTY_VNIC_PROFILE_ID } from '_/constants'

const NIC_INTERFACES = createNicInterfacesList()
const NIC_INTERFACE_DEFAULT = 'virtio'

export const NicNameWithLabels = ({ id, nic }) => {
  const idPrefix = `${id}-nic-${nic.id}`
  return <React.Fragment>
    <span id={`${idPrefix}-name`}>{ nic.name }</span>
    { nic.isFromTemplate &&
      <OverlayTooltip id={`${idPrefix}-template-defined-badge`} tooltip={msg.templateDefined()} placement='top'>
        <Label id={`${idPrefix}-from-template`} className={style['nic-label']}>
          T
        </Label>
      </OverlayTooltip>
    }
  </React.Fragment>
}
NicNameWithLabels.propTypes = {
  id: PropTypes.string,
  nic: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    isFromTemplate: PropTypes.bool,
  }),
}

/**
 * The nic table cannot be completely a controlled component, some state about rows being
 * edited needs to be held within the component.  Right now only the fact that a row is
 * being edited is being tracked in component state.
 *
 * Text fields can't notify onChange since any change will cause the field to loose focus
 * as the component state is updated (not exactly sure if it because of code here, in
 * patternfly-react or in the underlying reactabular itself).  Text fields update onBlur,
 * and that does cause some issues with keyboard navigation.
 */
class Networking extends React.Component {
  constructor (props) {
    super(props)
    this.handleCellChange = this.handleCellChange.bind(this)
    this.handleRowCancelChange = this.handleRowCancelChange.bind(this)
    this.handleRowConfirmChange = this.handleRowConfirmChange.bind(this)
    this.onCreateNic = this.onCreateNic.bind(this)
    this.onDeleteRow = this.onDeleteRow.bind(this)
    this.onEditNic = this.onEditNic.bind(this)
    this.rowRenderProps = this.rowRenderProps.bind(this)

    this.state = {
      editing: {},
      creating: false,
    }

    const idPrefix = this.props.id || 'create-vm-wizard-nics'

    // ---- Table Row Editing Controller
    this.inlineEditController = {
      isEditing: ({ rowData, column, property }) => this.state.editing[rowData.id] !== undefined,
      onActivate: ({ rowData }) => this.onEditNic(rowData),
      onConfirm: ({ rowData }) => this.handleRowConfirmChange(rowData),
      onCancel: ({ rowData }) => this.handleRowCancelChange(rowData),
    }

    // ----- Table Cell Formatters
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
          label: msg.createVmNetTableHeaderNicName(),
          formatters: [headerFormatText],
          props: {
            style: {
              width: '32%',
            },
          },
        },
        property: 'name',
        cell: {
          formatters: [inlineEditFormatter],
        },
        valueView: (value, { rowData }) => {
          return <NicNameWithLabels id={idPrefix} nic={rowData} />
        },
        editView: (value, { rowData }) => {
          const row = this.state.editing[rowData.id]

          return (
            <FormControl
              id={`${idPrefix}-${value}-name-edit`}
              type='text'
              defaultValue={row.name}
              onBlur={e => this.handleCellChange(rowData, 'name', e.target.value)}
            />
          )
        },
      },

      // vnic profile
      {
        header: {
          label: msg.createVmNetTableHeaderVnicProfile(),
          formatters: [headerFormatText],
          props: {
            style: {
              width: '32%',
            },
          },
        },
        property: 'vnic',
        cell: {
          formatters: [inlineEditFormatter],
        },
        editView: (value, { rowData }) => {
          const {
            dataCenterId,
            cluster,
            vnicProfiles,
          } = props
          const vnicList = createVNicProfileList(vnicProfiles, { dataCenterId, cluster })
          const row = this.state.editing[rowData.id]

          return (
            <SelectBox
              id={`${idPrefix}-${value}-vnic-profile-edit`}
              items={vnicList}
              selected={row.vnicProfileId}
              onChange={value => this.handleCellChange(rowData, 'vnicProfileId', value)}
            />
          )
        },
      },

      // device type
      {
        header: {
          label: msg.createVmNetTableHeaderType(),
          formatters: [headerFormatText],
          props: {
            style: {
              width: '32%',
            },
          },
        },
        property: 'device',
        cell: {
          formatters: [inlineEditFormatter],
        },
        editView: (value, { rowData }) => {
          const row = this.state.editing[rowData.id]

          return (
            <SelectBox
              id={`${idPrefix}-${value}-device-edit`}
              items={NIC_INTERFACES}
              selected={row.deviceType}
              onChange={value => this.handleCellChange(rowData, 'deviceType', value)}
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
              width: '40px',
            },
          },
        },
        type: 'actions',
        cell: {
          formatters: [
            (value, { rowData, rowIndex }) => {
              const hideKebab = this.state.creating === rowData.id
              const actionsDisabled = !!this.state.creating || Object.keys(this.state.editing).length > 0 || rowData.isFromTemplate
              const templateDefined = rowData.isFromTemplate
              const kebabId = `${idPrefix}-kebab-${rowData.name}`

              return <React.Fragment>
                { hideKebab && <Table.Cell /> }

                { templateDefined &&
                  <Table.Cell className={style['nic-from-template']}>
                    <FieldLevelHelp content={msg.createVmNetNoEditHelpMessage()} inline />
                  </Table.Cell>
                }

                { !hideKebab && !templateDefined &&
                  <Table.Cell className={style['kebab-menu-cell']}>
                    <DropdownKebab
                      id={kebabId}
                      className={style['action-kebab']}
                      title={msg.createVmNetEditActions()}
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
                        onSelect={() => { this.onDeleteRow(rowData) }}
                        disabled={actionsDisabled}
                      >
                        {msg.delete()}
                      </MenuItem>
                    </DropdownKebab>
                  </Table.Cell>
                }
              </React.Fragment>
            },
          ],
        },
      },
    ]
  }

  onCreateNic () {
    const newId = generateUnique('NEW_')
    const nextNicName = suggestNicName(this.props.nics)

    // Setup a new nic in the editing object
    this.setState(state => ({
      creating: newId,
      editing: {
        ...state.editing,
        [newId]: {
          id: newId,
          name: nextNicName,
          deviceType: NIC_INTERFACE_DEFAULT,
          vnicProfileId: EMPTY_VNIC_PROFILE_ID,
        },
      },
    }))
  }

  onEditNic (rowData) {
    this.setState(state => ({
      editing: {
        ...state.editing,
        [rowData.id]: rowData,
      },
    }))
  }

  onDeleteRow (rowData) {
    this.props.onUpdate({ remove: rowData.id })
  }

  handleCellChange (rowData, field, value) {
    const editingRow = this.state.editing[rowData.id]
    if (editingRow) {
      editingRow[field] = value
      this.setState(state => ({
        editing: {
          ...state.editing,
          [rowData.id]: editingRow,
        },
      }))
    }
  }

  // Push the new or editing row up via __onUpdate__
  handleRowConfirmChange (rowData) {
    const actionCreate = !!this.state.creating && this.state.creating === rowData.id
    const editedRow = this.state.editing[rowData.id]

    // TODO: Add field level validation for the edit or create fields

    this.props.onUpdate({ [actionCreate ? 'create' : 'update']: editedRow })
    this.handleRowCancelChange(rowData)
  }

  // Cancel the creation or editing of a row by throwing out edit state
  handleRowCancelChange (rowData) {
    this.components = undefined // remove the current reference to make the table re-render
    this.setState(state => {
      const editing = state.editing
      delete editing[rowData.id]
      return {
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
      id: idPrefix = 'create-vm-wizard-nics',
      dataCenterId,
      cluster,
      nics,
      vnicProfiles,
    } = this.props

    const vnicList = createVNicProfileList(vnicProfiles, { dataCenterId, cluster })
    const enableCreate = vnicList.length > 0 && Object.keys(this.state.editing).length === 0

    const nicList = sortNicsDisks([...nics])
      .concat(this.state.creating ? [ this.state.editing[this.state.creating] ] : [])
      .map(nic => ({
        ...(this.state.editing[nic.id] ? this.state.editing[nic.id] : nic),
        vnic: vnicList.find(vnic => vnic.id === nic.vnicProfileId)
          ? vnicList.find(vnic => vnic.id === nic.vnicProfileId).value
          : msg.createVmNetUnknownVnicProfile(),
        device: enumMsg('NicInterface', nic.deviceType),
      }))
    const components = {
      body: {
        row: _TableInlineEditRow,
      },
    }
    this.components = this.components || components // if the table should (re)render the value of this.components should be undefined

    return <div className={style['settings-container']} id={idPrefix}>
      { nicList.length === 0 && <React.Fragment>
        <EmptyState>
          <EmptyState.Icon />
          <EmptyState.Title>{msg.createVmNetEmptyTitle()}</EmptyState.Title>
          <EmptyState.Info>{msg.createVmNetEmptyInfo()}</EmptyState.Info>
          <EmptyState.Action>
            <Button bsStyle='primary' bsSize='large' onClick={this.onCreateNic}>
              {msg.nicActionCreateNew()}
            </Button>
          </EmptyState.Action>
        </EmptyState>
      </React.Fragment> }

      { nicList.length > 0 && <React.Fragment>
        <div className={style['action-buttons']}>
          <Button bsStyle='default' disabled={!enableCreate} onClick={this.onCreateNic}>
            {msg.nicActionCreateNew()}
          </Button>
        </div>
        <div className={style['nic-table']}>
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
              rows={nicList}
              rowKey='id'
              onRow={(...rest) => this.rowRenderProps(nicList, ...rest)}
            />
          </Table.PfProvider>
        </div>
      </React.Fragment> }
    </div>
  }
}

Networking.propTypes = {
  id: PropTypes.string,
  nics: PropTypes.arrayOf(PropTypes.shape(NIC_SHAPE)).isRequired,

  clusterId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  dataCenterId: PropTypes.string.isRequired,

  cluster: PropTypes.object.isRequired,
  vnicProfiles: PropTypes.object.isRequired,

  onUpdate: PropTypes.func.isRequired,
}

export default connect(
  (state, { clusterId }) => ({
    cluster: state.clusters.get(clusterId),
    vnicProfiles: state.vnicProfiles,
  })
)(Networking)
