import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { logDebug, generateUnique } from '../../helpers'

import style from './style.css'

import LabeledSelect from '../LabeledSelect'
import LabeledTextField from '../LabeledTextField'
import DetailContainer from '../DetailContainer'
import ErrorAlert from '../ErrorAlert'
import FieldHelp from '../FieldHelp'

import Selectors from '../../selectors'
import {
  closeDialog,
  requestCloseDialogConfirmation,
  createVm,
  editVm,
} from '../../actions/index'

function sortedBy (immutableCollection, sortBy) { // TODO: move to helpers
  return immutableCollection.sort(
    (a, b) => a.get(sortBy).localeCompare(b.get(sortBy))
  )
}

const zeroUID = '00000000-0000-0000-0000-000000000000'

class VmDialog extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      actionUniqueId: undefined,

      id: undefined,

      name: '',
      description: '',
      cpus: 1,
      memory: 1024 * 1024 * 1024,

      clusterId: undefined,
      templateId: undefined,
      osId: undefined,
    }

    this.closeDialog = this.closeDialog.bind(this)
    this.submitHandler = this.submitHandler.bind(this)
    this.initDefaults = this.initDefaults.bind(this)
    this.onIntegerChanged = this.onIntegerChanged.bind(this)

    this.getCluster = this.getCluster.bind(this)
    this.getTemplate = this.getTemplate.bind(this)
    this.getOS = this.getOS.bind(this)
    this.getOsIdFromType = this.getOsIdFromType.bind(this)

    this.onChangeCluster = this.onChangeCluster.bind(this)
    this.onChangeTemplate = this.onChangeTemplate.bind(this)
    this.doChangeTemplateIdTo = this.doChangeTemplateIdTo.bind(this)
    this.onChangeOperatingSystem = this.onChangeOperatingSystem.bind(this)
    this.doChangeOsIdTo = this.doChangeOsIdTo.bind(this)
    this.onChangeVmName = this.onChangeVmName.bind(this)
    this.onChangeVmDescription = this.onChangeVmDescription.bind(this)
    this.onChangeVmMemory = this.onChangeVmMemory.bind(this)
    this.onChangeVmCpu = this.onChangeVmCpu.bind(this)
  }

  componentDidMount () {
    const vm = this.props.vm
    if (vm) { // "edit" mode
      this.setState({
        id: vm.get('id'),
        name: vm.get('name'),
        description: vm.get('description'),
        cpus: vm.getIn(['cpu', 'vCPUs']),
        memory: vm.getIn(['memory', 'total']),

        clusterId: vm.getIn(['cluster', 'id']),
        templateId: vm.getIn(['template', 'id']),
        osId: this.getOsIdFromType(vm.getIn(['os', 'type'])),
      })
    }
    setTimeout(() => this.initDefaults(), 0)
  }

  generateActionUniqueId () {
    const actionUniqueId = generateUnique('vm-dialog-')
    this.setState({
      actionUniqueId,
    })
    return actionUniqueId
  }

  submitHandler (e) {
    const actionUniqueId = this.generateActionUniqueId()
    e.preventDefault()
    this.props.vm
      ? this.props.updateVm(this.composeVm(), actionUniqueId)
      : this.props.addVm(this.composeVm(), actionUniqueId)
  }

  getLatestUserMessage () {
    const { actionUniqueId } = this.state
    const filtered = this.props.userMessages
      .get('records')
      .filter(record => record.failedAction && record.failedAction.actionUniqueId === actionUniqueId)
    const last = filtered.last()

    return last ? last.message : undefined
  }

  /**
   * Compose vm object from entered values
   *
   * Structure conforms vmToInternal()
   */
  composeVm () {
    const os = this.props.operatingSystems
      .get('operatingSystems')
      .get(this.state.osId)

    return {
      'id': this.state.id,
      'name': this.state.name,
      'description': this.state.description,
      'template': { 'id': this.state.templateId },
      'cluster': { 'id': this.state.clusterId },
      'memory': this.state.memory,
      'os': {
        'type': os.get('name'),
      },
      'cpu': {
        'topology': {
          'cores': '1', // TODO: fix to conform topology in template!
          'sockets': this.state.cpus,
          'threads': '1',
        },
      },
    }
  }

  closeDialog (e) {
    e.preventDefault()
    this.props.onCloseDialog()
  }

  onChangeGeneral () {
    this.props.requestCloseDialogConfirmation() // enforce confirmation dialog in case of Cancel action
  }

  onChangeVmName (event) {
    this.onChangeGeneral()
    this.setState({ name: event.target.value })
  }
  onChangeVmDescription (event) {
    this.setState({ description: event.target.value })
  }

  onChangeVmMemory (event) {
    this.onIntegerChanged({ stateProp: 'memory', value: event.target.value, factor: 1024 * 1024 })
  }

  onChangeVmCpu (event) {
    this.onIntegerChanged({ stateProp: 'cpus', value: event.target.value })
  }

  onIntegerChanged ({ value, stateProp, factor = 1 }) {
    const intVal = parseInt(value)
    if (!isNaN(intVal)) {
      const stateChange = {}
      stateChange[stateProp] = intVal * factor
      this.setState(stateChange)
    } else {
      console.log('not an integer: ', value)
      this.forceUpdate()
    }
  }

  onChangeOperatingSystem (event) {
    this.doChangeOsIdTo(event.target.value)
  }

  doChangeOsIdTo (osId) {
    this.setState({
      osId,
    })
  }

  getOsIdFromType (type) {
    // hack: this.props.operatingSystems shall be used instead, but this is harmless reuse of code
    const os = Selectors.getOperatingSystemByName(type)
    return os ? os.get('id') : undefined
  }

  /**
   * @returns OperatingSystem object conforming this.state.osId
   */
  getOS () {
    const osId = this.state.osId
    if (osId) {
      const os = this.props.operatingSystems.get('operatingSystems').get(osId)
      if (os) {
        return os
      }
    }

    return undefined
  }

  /**
   * User selected different template.
   */
  onChangeTemplate (event) {
    const templateId = event.target.value
    this.doChangeTemplateIdTo(templateId)
  }

  doChangeTemplateIdTo (templateId) {
    const template = this.getTemplate(templateId)
    let { memory, cpus, osId } = this.state

    if (template) {
      memory = template.get('memory')
      cpus = template.getIn(['cpu', 'topology', 'cores'], 1) * template.getIn(['cpu', 'topology', 'sockets'], 1) * template.getIn(['cpu', 'topology', 'threads'], 1)

      osId = this.getOsIdFromType(template.getIn(['os', 'type'], 'Blank'))
    }

    this.setState({
      templateId,
      memory,
      cpus,
    })

    if (this.state.osId !== osId) {
      this.doChangeOsIdTo(osId)
    }
    // fire external data retrieval here if needed after Template change
  }

  /**
   * @returns template object conforming this.state.templateId
   */
  getTemplate (templateId) {
    templateId = templateId || this.state.templateId
    if (templateId) {
      const template = this.props.templates.get('templates').get(templateId)
      if (template) {
        return template
      }
    }

    return undefined
  }

  /**
   * User selected different cluster.
   */
  onChangeCluster (event) {
    const clusterId = event.target.value
    this.setState({
      clusterId,
    })

    const template = this.getTemplate(this.state.templateId)
    if (template && template.get('clusterId') && template.get('clusterId') !== clusterId) {
      this.doChangeTemplateIdTo(zeroUID) // Careful: this.state.clusterId still contains previous clusterId, call setTimeout(fnc, 0) if needed otherwise
    }

    // fire external data retrieval here if needed after Cluster change
  }

  /**
   * @returns cluster object conforming this.state.clusterId
   */
  getCluster () {
    const clusterId = this.state.clusterId
    if (clusterId) {
      const cluster = this.props.clusters.get('clusters').get(clusterId)
      if (cluster) {
        return cluster
      }
    }

    return undefined
  }

  initDefaults () {
    const stateChange = {}
    const defaultClusterName = 'Default'

    if (!this.getCluster()) {
      const clustersList = this.props.clusters.get('clusters').toList()
      const def = (clustersList.filter(item => item.get('name') === defaultClusterName).first()) || clustersList.first()
      stateChange.clusterId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for clusterId = ${this.state.clusterId} to ${stateChange.clusterId}`)
    }

    if (!this.getTemplate()) {
      const def = this.props.templates.getIn(['templates', zeroUID]) || this.props.templates.get('templates').toList().first()
      stateChange.templateId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for templateId = ${this.state.templateId} to ${stateChange.templateId}`)
    }

    if (!this.getOS()) {
      const osList = this.props.operatingSystems.get('operatingSystems').toList()
      const def = osList.sort((a, b) => a.get('id').localeCompare(b.get('id'))).first()
      stateChange.osId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for osId = ${this.state.osId} to ${stateChange.osId}`)
    }

    this.setState(stateChange)
  }

  render () {
    const isEdit = !!this.props.vm

    const sortedClusters = sortedBy(this.props.clusters.get('clusters'), 'name')

    const filteredTemplates = this.props.templates.get('templates')
      .toList()
      .filter(template => template.get('clusterId') === this.state.clusterId || !template.get('clusterId'))
    const sortedTemplates = sortedBy(filteredTemplates, 'name')

    const sortedOSs = sortedBy(this.props.operatingSystems.get('operatingSystems'), 'description')

    const cluster = this.getCluster()
    const template = this.getTemplate()
    const os = this.getOS()

    const submitText = isEdit ? 'Update VM' : 'Create VM'

    const templateNameRenderer = (template) => {
      const version = template.get('version')
      const versionName = version.get('name')
      const templateName = template.get('name')

      return versionName
        ? (`${templateName} (${versionName})`)
        : templateName
    }

    return (
      <DetailContainer>
        <h1>{isEdit ? 'Edit Virtual Machine' : 'Create A New Virtual Machine'}</h1>
        <hr />
        <ErrorAlert message={this.getLatestUserMessage()} />
        <form className='form-horizontal'>
          <LabeledTextField
            selectClass='combobox form-control'
            id='vmName'
            label='Name'
            placeholder='Enter VM Name'
            value={this.state.name}
            fieldHelp={<FieldHelp title='Name' content='Unique name of the virtual machine.' />}
            onChange={this.onChangeVmName} />

          <LabeledTextField
            selectClass='combobox form-control'
            id='vmDescription'
            label='Description'
            placeholder='Enter VM Description (optional)'
            value={this.state.description}
            fieldHelp={<FieldHelp title='Description' content='Optional user description of the virtual machine.' />}
            onChange={this.onChangeVmDescription} />

          <LabeledSelect
            id='clusterSelect'
            label='Cluster'
            selectClass='combobox form-control'
            onChange={this.onChangeCluster}
            value={cluster ? cluster.get('id') : ''}
            data={sortedClusters}
            fieldHelp={<FieldHelp title='Cluster' content='Group of hosts the virtual machine can be running on.' />}
          />

          <LabeledSelect
            id='templateSelect'
            label='Template'
            selectClass='combobox form-control'
            onChange={this.onChangeTemplate}
            value={template ? template.get('id') : ''}
            data={sortedTemplates}
            fieldHelp={<FieldHelp title='Template' content='Contains the configuration and disks which will be used to create this virtual machine. Please customize as needed.' />}
            renderer={templateNameRenderer} />

          <LabeledSelect
            id='operatingSystemSelect'
            label='Operating System'
            selectClass='combobox form-control'
            onChange={this.onChangeOperatingSystem}
            value={os ? os.get('id') : ''}
            data={sortedOSs}
            fieldHelp={<FieldHelp title='Operating System' content='Operating system installed on the virtual machine.' />}
            renderer={(item) => item.get('description')} />

          <LabeledTextField
            type='number'
            id='vmMemory'
            label='Memory (MB)'
            placeholder='VM Memory'
            value={this.state.memory / 1024 / 1024}
            onChange={this.onChangeVmMemory}
            fieldHelp={<FieldHelp title='Memory' content='Total memory the virtual machine will be equipped with. In megabytes.' />}
            step={256} />

          <LabeledTextField
            type='number'
            id='vmCpu'
            label='Number of CPUs'
            placeholder='CPUs'
            value={this.state.cpus}
            onChange={this.onChangeVmCpu}
            fieldHelp={<FieldHelp title='Number of CPUs' content='Total count of virtual processors the virtual machine will be equipped with.' />}
            min={1}
          />

          <div className={style['vm-dialog-buttons']}>
            <button className='btn btn-default' type='button' onClick={this.closeDialog}>Close</button>
            <button className='btn btn-primary' type='button' onClick={this.submitHandler}>{submitText}</button>
          </div>
        </form>
      </DetailContainer>
    )
  }
}

VmDialog.propTypes = {
  vm: PropTypes.object, // optional, VM object to edit

  clusters: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired,
  userMessages: PropTypes.object.isRequired,

  onCloseDialog: PropTypes.func.isRequired,
  requestCloseDialogConfirmation: PropTypes.func.isRequired,
  addVm: PropTypes.func.isRequired,
  updateVm: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    clusters: state.clusters,
    templates: state.templates,
    operatingSystems: state.operatingSystems,
    userMessages: state.userMessages,
  }),
  (dispatch) => ({
    onCloseDialog: () => dispatch(closeDialog({ force: false })),
    requestCloseDialogConfirmation: () => dispatch(requestCloseDialogConfirmation()),
    addVm: (vm, actionUniqueId) => dispatch(createVm(vm, actionUniqueId)),
    updateVm: (vm, actionUniqueId) => dispatch(editVm(vm, actionUniqueId)),
  })
)(VmDialog)
