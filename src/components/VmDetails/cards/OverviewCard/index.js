import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import sharedStyle from '../../../sharedStyle.css'
import { getOsHumanName, getVmIcon, isVmNameValid, isHostNameValid } from '_/components/utils'
import { enumMsg, withMsg } from '_/intl'
import { generateUnique, buildMessageFromRecord } from '_/helpers'
import { formatUptimeDuration } from '_/utils'
import { editVm } from '_/actions'

import { FormControl, FormGroup, HelpBlock, Alert, Checkbox } from 'patternfly-react'

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

      nameError: false,
      updateCloudInit: true,
      disableHostnameToggle: false,
    }
    this.trackUpdates = {}

    this.handleCardOnStartEdit = this.handleCardOnStartEdit.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleCardOnCancel = this.handleCardOnCancel.bind(this)
    this.handleCardOnSave = this.handleCardOnSave.bind(this)
    this.isCloudInitHostnameUpdate = this.isCloudInitHostnameUpdate.bind(this)
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

  isCloudInitHostnameUpdate () {
    const template = this.props.templates.get(this.props.vm.getIn(['template', 'id']))
    if (!template) {
      return false
    }
    const templateHostName = template.getIn(['cloudInit', 'hostName'])
    if (templateHostName) {
      return false
    }
    return true
  }

  handleCardOnStartEdit () {
    this.trackUpdates = {}
    this.setState({
      isEditing: true,
      isDirty: false,
      correlationId: null,
      correlatedMessages: null,
      nameError: false,
      updateCloudInit: true,
    })
    this.props.onEditChange(true)
  }

  handleChange (fieldName, value) {
    if (this.state.isEditing && !this.state.isDirty) {
      this.props.onEditChange(true, true)
    }

    const newState = { isDirty: true }
    let updates = this.state.vm
    // NOTE: The DetailsCard has the possibility of chained updates.  Overview doesn't
    //       have that need, so there is no __changeQueue__ setup here.

    let fieldUpdated
    switch (fieldName) {
      case 'name':
        updates = updates.set('name', value)
        fieldUpdated = 'name'
        newState.nameError = !isVmNameValid(value)
        newState.disableHostnameToggle = !isHostNameValid(value)
        if (newState.disableHostnameToggle) {
          newState.updateCloudInit = false
        }
        break

      case 'description':
        updates = updates.set('description', value)
        fieldUpdated = 'description'
        break
    }

    if (updates !== this.state.vm) {
      this.trackUpdates[fieldUpdated] = true
      this.setState({ vm: updates, ...newState })
    }
  }

  handleCardOnCancel () {
    this.setState({
      isEditing: false,
      isDirty: false,
      correlationId: null,
      correlatedMessages: null,
      nameError: false,
      updateCloudInit: true,
    })
    this.props.onEditChange(false)
  }

  handleCardOnSave () {
    if (Object.keys(this.trackUpdates).length === 0) {
      this.handleCardOnCancel()
      return
    }

    const { vm: stateVm, updateCloudInit } = this.state
    const correlationId = generateUnique('OverviewCard-save_')

    // --- Create a partial VM (in the internal format expected by editVm() saga),
    //     only including the fields that have been updated
    const vmUpdates = { id: stateVm.get('id') }

    if (this.trackUpdates['name']) {
      vmUpdates['name'] = stateVm.get('name')
    }

    if (this.trackUpdates['description']) {
      vmUpdates['description'] = stateVm.get('description')
    }

    if (this.trackUpdates['name'] && updateCloudInit && this.isCloudInitHostnameUpdate()) {
      vmUpdates['cloudInit'] = stateVm.get('cloudInit').toJS()
      vmUpdates['cloudInit']['hostName'] = stateVm.get('name')
    }

    // --- dispatch the save
    //     saveChanges will add the result of the operation to the vm under the given
    //     correlationId. So, when the vm prop changes, it can be checked and the edit
    //     mode controlled based on the result of the dispatch/saga/api call.
    this.setState({ correlationId })
    this.props.saveChanges(vmUpdates, correlationId)

    return false // componentDidUpdate will swap the BaseCard out of edit mode as appropriate
  }

  render () {
    const { vm, icons, vms, operatingSystems, isEditable, msg } = this.props
    const { isEditing, correlatedMessages, nameError, updateCloudInit, disableHostnameToggle } = this.state

    const elapsedUptime = vm.getIn(['statistics', 'elapsedUptime', 'firstDatum'], 0)
    const uptime = elapsedUptime <= 0
      ? formatUptimeDuration({ start: vm.get('startTime') })
      : formatUptimeDuration({ interval: elapsedUptime * 1000 })

    const icon = getVmIcon(icons, operatingSystems, vm)
    const idPrefix = 'vmdetail-overview'

    const showCloudInitCheckbox = isEditing && this.trackUpdates['name'] && !nameError && this.isCloudInitHostnameUpdate()

    const poolId = vm.getIn(['pool', 'id'])
    const isPoolVm = !!poolId
    let pool = null
    if (isPoolVm) {
      pool = vms.getIn(['pools', poolId])
    }
    const isPoolAutomatic = pool && pool.get('type') === 'automatic'

    return (
      <BaseCard
        editMode={isEditing}
        editable={isEditable}
        editTooltip={msg.edit()}
        editTooltipPlacement={'bottom'}
        disableTooltip={isPoolVm && isPoolAutomatic ? msg.automaticPoolsNotEditable({ poolName: pool.get('name') }) : undefined}
        idPrefix={idPrefix}
        disableSaveButton={nameError}
        onStartEdit={this.handleCardOnStartEdit}
        onCancel={this.handleCardOnCancel}
        onSave={this.handleCardOnSave}
      >
        {({ isEditing }) => {
          return (
            <div>
              <div id={`${idPrefix}-os-label`} className={`${sharedStyle['operating-system-label']} ${style['operating-system-label']}`}>
                {getOsHumanName(vm.getIn(['os', 'type']))}
              </div>

              {isPoolVm && pool && <span className={style['pool-vm-label']} style={{ backgroundColor: pool.get('color') }}>{ pool.get('name') }</span>}
              <div className={style['container']}>
                <div className={style['os-icon']}>
                  <VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' />
                </div>
                <div className={style['vm-info']}>
                  <div className={style['vm-name']}>
                    { !isEditing && <span id={`${idPrefix}-name`}>{vm.get('name')}</span> }
                    { isEditing &&
                      <FormGroup controlId={`${idPrefix}-name-edit`} validationState={nameError ? 'error' : null}>
                        <FormControl
                          type='text'
                          value={this.state.vm.get('name')}
                          onChange={e => this.handleChange('name', e.target.value)}
                        />
                        { nameError &&
                          <HelpBlock>
                            {msg.pleaseEnterValidVmName()}
                          </HelpBlock>
                        }
                      </FormGroup>
                    }
                    {
                      showCloudInitCheckbox &&
                      <div className={style['vm-checkbox']}>
                        <Checkbox
                          id={`${idPrefix}-cloud-init`}
                          checked={updateCloudInit}
                          onChange={(e) => this.setState({ updateCloudInit: e.target.checked })}
                          disabled={disableHostnameToggle}
                        >
                          { !disableHostnameToggle
                            ? msg.updateCloudInit()
                            : msg.cannotUpdateCloudInitHostname()
                          }
                        </Checkbox>
                      </div>
                    }
                  </div>

                  <div className={style['vm-status']} id={`${idPrefix}-status`}>
                    <VmStatusIcon id={`${idPrefix}-status-icon`} className={style['vm-status-icon']} status={vm.get('status')} />
                    <span className={style['vm-status-text']} id={`${idPrefix}-status-value`}>{enumMsg('VmStatus', vm.get('status'), msg)}</span>

                    { uptime &&
                      <div className={style['vm-uptime']} id={`${idPrefix}-uptime`}>{msg.uptimeDuration({ uptime })}</div>
                    }
                  </div>

                  <div>
                    { !isEditing &&
                      <div id={`${idPrefix}-description`} className={style['vm-description']}>{vm.get('description')}</div>
                    }
                    { isEditing &&
                      <FormControl
                        id={`${idPrefix}-description-edit`}
                        componentClass='textarea'
                        rows='5'
                        value={this.state.vm.get('description')}
                        onChange={e => this.handleChange('description', e.target.value)}
                      />
                    }
                  </div>
                </div>
              </div>

              { correlatedMessages && correlatedMessages.size > 0 &&
                correlatedMessages.map((message, key) =>
                  <Alert key={`user-message-${key}`} type='error' style={{ margin: '5px 0 0 0' }} id={`${idPrefix}-alert`}>
                    {buildMessageFromRecord(message.toJS(), msg)}
                  </Alert>
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
  vms: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired, // deep immutable, {[id: string]: OperatingSystem}
  userMessages: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,

  saveChanges: PropTypes.func.isRequired,

  msg: PropTypes.object.isRequired,
}

export default connect(
  (state, { vm }) => ({
    icons: state.icons,
    vms: state.vms,
    operatingSystems: state.operatingSystems,
    userMessages: state.userMessages,
    templates: state.templates,
    isEditable: vm.get('canUserEditVm'),
  }),
  (dispatch) => ({
    saveChanges: (minimalVmChanges, correlationId) => dispatch(editVm({ vm: minimalVmChanges }, { correlationId })),
  })
)(withMsg(OverviewCard))
