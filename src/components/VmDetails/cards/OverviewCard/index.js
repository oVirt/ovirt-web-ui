import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import sharedStyle from '../../../sharedStyle.css'
import { getOsHumanName, getVmIcon } from '../../../utils'
import { enumMsg } from '../../../../intl'
import { generateUnique } from '../../../../helpers'

import { editVm } from '../../../../actions'

import { Media } from 'react-bootstrap'
import { FormControl, Alert } from 'patternfly-react'

import BaseCard from '../../BaseCard'
import VmIcon from '../../../VmIcon'
import VmStatusIcon from '../../../VmStatusIcon'
import style from './style.css'

/**
 * Overview of the VM (icon, OS type, name, state, description)
 *
 * Edits:
 *   - VM Icon (future work to allow setting a custom icon for the VM)
 *   - VM Name
 *   - VM Description
 *
 * TODO: The REST API return the current running value and flags "next_run_configuration_exists: true"
 * TODO: and the next_run config can be queried with ;next_run matrix param on Vm query (/vm/<vmId>;next_run)
 * TODO: therefore it is possible to highlight the individual fields that will change on next_run (i.e. VM shutdown)
 */
class OverviewCard extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      vm: props.vm, // ImmutableJS Map
      isEditing: false,
      isDirty: false,
      correlationId: null,
      correlatedMessages: null,
    }

    this.handleCardOnStartEdit = this.handleCardOnStartEdit.bind(this)
    this.handleCardOnCancel = this.handleCardOnCancel.bind(this)
    this.handleCardOnSave = this.handleCardOnSave.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  static getDerivedStateFromProps (props, state) {
    if (!state.isEditing) {
      return { vm: props.vm }
    }

    // Check the results of the saveChanges call and either setup to drop out of
    // edit mode, or pull the error messages to display on the card.
    if (state.isEditing && state.correlationId && props.vm.hasIn(['actionResults', state.correlationId])) {
      const actionResult = props.vm.getIn(['actionResults', state.correlationId])
      if (actionResult) {
        return { isEditing: false, isDirty: false, correlationId: null, correlatedMessages: null }
      }
      return {
        correlatedMessages: props.userMessages.get('records').filter(
          record => record.getIn([ 'failedAction', 'meta', 'correlationId' ]) === state.correlationId
        ),
      }
    }

    return null
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.isEditing && !this.state.isEditing) {
      this.props.onEditChange(false)
    }
  }

  handleCardOnStartEdit () {
    this.setState({ isEditing: true, isDirty: false, correlationId: null, correlatedMessages: null })
    this.props.onEditChange(true)
  }

  handleCardOnCancel () {
    this.setState({ isEditing: false, isDirty: false, correlationId: null, correlatedMessages: null })
    this.props.onEditChange(false)
  }

  handleCardOnSave () {
    const { vm: stateVm } = this.state
    const correlationId = generateUnique('OverviewCard-save_')

    const vmUpdates = {
      id: stateVm.get('id'),
      name: stateVm.get('name'),
      description: stateVm.get('description'),
    }
    this.setState({ correlationId })
    this.props.saveChanges(vmUpdates, correlationId)

    // saveChanges will add the result of the operation to the vm under the given correlationId
    // so when the vm prop changes, the result can be checked and close the edit as needed

    return false // componentDidUpdate will swap the BaseCard out of edit mode as appropriate
  }

  handleChange (fieldName, { target: { value } }) {
    if (this.state.isEditing && !this.state.isDirty) {
      this.props.onEditChange(true, true)
    }

    const newVm = this.state.vm.set(fieldName, value)
    this.setState({ vm: newVm, isDirty: true })
  }

  render () {
    const { vm, icons, operatingSystems, isEditable } = this.props
    const { isEditing, correlatedMessages } = this.state

    const icon = getVmIcon(icons, operatingSystems, vm)

    return (
      <BaseCard
        editMode={isEditing}
        editable={isEditable}
        editTooltip={`Edit ${vm.get('id')}`}
        onStartEdit={this.handleCardOnStartEdit}
        onCancel={this.handleCardOnCancel}
        onSave={this.handleCardOnSave}
      >
        {({ isEditing }) => {
          return (
            <div>
              <div className={`${sharedStyle['operating-system-label']} ${style['operating-system-label']}`}>{getOsHumanName(vm.getIn(['os', 'type']))}</div>

              <Media>
                <Media.Left>
                  <VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' />
                </Media.Left>
                <Media.Body>
                  <div className={style['vm-name']}>{isEditing
                    ? (
                      <FormControl type='text' value={this.state.vm.get('name')} onChange={e => this.handleChange('name', e)} />
                    )
                    : (
                      <span>{vm.get('name')}</span>
                    )
                  }</div>

                  <div className={style['vm-status']}>
                    <VmStatusIcon className={style['vm-status-icon']} state={vm.get('status')} />
                    <span className={style['vm-status-text']}>{enumMsg('VmStatus', vm.get('status'))}</span>
                  </div>

                  <div>{isEditing
                    ? (
                      <FormControl
                        componentClass='textarea'
                        rows='5'
                        value={this.state.vm.get('description')}
                        onChange={e => this.handleChange('description', e)} />
                    )
                    : (
                      <div className={style['vm-description']}>{vm.get('description')}</div>
                    )
                  }</div>
                </Media.Body>
              </Media>

              {correlatedMessages && correlatedMessages.size > 0 &&
                correlatedMessages.map((message, key) =>
                  <Alert key={`user-message-${key}`} type='error' style={{ margin: '5px 0 0 0' }}>{message.get('message')}</Alert>
                )
              }
            </div>
          )
        }}
      </BaseCard>
    )
  }
}
OverviewCard.propTypes = {
  vm: PropTypes.object,
  onEditChange: PropTypes.func,
  isEditable: PropTypes.bool,

  icons: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired, // deep immutable, {[id: string]: OperatingSystem}
  userMessages: PropTypes.object.isRequired,

  saveChanges: PropTypes.func.isRequired,
}

export default connect(
  (state, { vm }) => ({
    icons: state.icons,
    operatingSystems: state.operatingSystems,
    userMessages: state.userMessages,
    isEditable: vm.get('canUserEditVm'),
  }),
  (dispatch) => ({
    saveChanges: (minimalVmChanges, correlationId) => dispatch(editVm({ vm: minimalVmChanges }, { correlationId })),
  })
)(OverviewCard)
