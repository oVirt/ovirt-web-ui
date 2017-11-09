import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { Link, Redirect, Prompt } from 'react-router-dom'

import { logDebug, generateUnique, templateNameRenderer } from '../../helpers'

import style from './style.css'
import sharedStyle from '../sharedStyle.css'

import DetailContainer from '../DetailContainer'
import ErrorAlert from '../ErrorAlert'

import FieldHelp from '../FieldHelp/index'

import { VmIcon } from 'ovirt-ui-components'

import Selectors from '../../selectors'
import {
  closeDialog,
} from '../../actions/index'

import {
  editVm,
  createVm,
  setSavedVm,
} from './actions'

import SelectBox from '../SelectBox'

import { MAX_VM_MEMORY_FACTOR } from '../../constants/index'

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
      actionUniqueId: generateUnique('vm-dialog-'),

      id: undefined,

      name: '',
      description: '',
      cpus: 1,
      memory: 1024 * 1024 * 1024,
      cdrom: {
        file: {
          id: '',
        },
      },

      clusterId: undefined,
      templateId: undefined,
      osId: undefined,
      saved: false,
      isChanged: false,
    }

    this.closeDialog = this.closeDialog.bind(this)
    this.submitHandler = this.submitHandler.bind(this)
    this.initDefaults = this.initDefaults.bind(this)
    this.onIntegerChanged = this.onIntegerChanged.bind(this)
    this.getMemoryPolicy = this.getMemoryPolicy.bind(this)

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
    this.onChangeCD = this.onChangeCD.bind(this)
  }

  componentWillMount () {
    this.props.onInit()
  }

  componentDidMount () {
    const vm = this.props.vm
    if (vm) { // 'edit' mode
      this.setState({
        id: vm.get('id'),
        name: vm.get('name'),
        description: vm.get('description'),
        cpus: vm.getIn(['cpu', 'vCPUs']),
        memory: vm.getIn(['memory', 'total']),

        clusterId: vm.getIn(['cluster', 'id']),
        templateId: vm.getIn(['template', 'id']),
        osId: this.getOsIdFromType(vm.getIn(['os', 'type'])),
        cdrom: {
          file: {
            id: null,
          },
        },
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
      : this.props.addVm(this.composeVm(), actionUniqueId, this.props.vms.get('page'))
    this.setState({
      saved: true,
    })
  }

  getLatestUserMessage () {
    const { actionUniqueId } = this.state
    const filtered = this.props.userMessages
      .get('records')
      .filter(record => record.failedAction && record.failedAction.actionUniqueId === actionUniqueId)
    const last = filtered.last()

    return last ? last.message : undefined
  }

  getMemoryPolicy () {
    const cluster = this.getCluster()
    const overCommitPercent = cluster && cluster.getIn(['memoryPolicy', 'overCommitPercent'])
    let guaranteed = overCommitPercent ? (this.state.memory * (100 / overCommitPercent)) : this.state.memory

    const memoryPolicy = {
      'max': this.state.memory * MAX_VM_MEMORY_FACTOR,
      'guaranteed': Math.round(guaranteed),
    }
    logDebug('getMemoryPolicy() resulting memory_policy: ', memoryPolicy)

    return memoryPolicy
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
      'memory': this.state.memory || 0,
      'memory_policy': this.getMemoryPolicy(),
      'cdrom': {
        'file': {
          'id': this.state.cdrom.file.id === null ? '' : this.state.cdrom.file.id,
        },
      },
      'os': {
        'type': os.get('name'),
      },
      'cpu': {
        'topology': {
          'cores': '1', // TODO: fix to conform topology in template!
          'sockets': this.state.cpus || 1,
          'threads': '1',
        },
      },
      'status': this.props.vm ? this.props.vm.get('status') : '',
    }
  }

  closeDialog (e) {
    e.preventDefault()
    this.props.onCloseDialog()
  }

  onChangeVmName (event) {
    this.setState({ name: event.target.value, isChanged: true })
  }
  onChangeVmDescription (event) {
    this.setState({ description: event.target.value, isChanged: true })
  }

  onChangeVmMemory (event) {
    this.onIntegerChanged({ stateProp: 'memory', value: event.target.value, factor: 1024 * 1024, isChanged: true })
  }

  onChangeVmCpu (event) {
    this.onIntegerChanged({ stateProp: 'cpus', value: event.target.value })
  }

  onChangeCD (fileId) {
    this.setState({ cdrom: { file: { id: fileId } }, isChanged: true })
  }

  onIntegerChanged ({ value, stateProp, factor = 1 }) {
    let intVal = parseInt(value)
    if (!isNaN(intVal)) {
      value = intVal * factor
    } else {
      console.log('not an integer: ', value)
      value = ''
    }

    const stateChange = {}
    stateChange[stateProp] = value
    stateChange['isChanged'] = true
    this.setState(stateChange)
  }

  onChangeOperatingSystem (osId) {
    this.doChangeOsIdTo(osId)
  }

  doChangeOsIdTo (osId) {
    this.setState({
      osId,
      isChanged: true,
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
  onChangeTemplate (templateId) {
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
      isChanged: true,
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
  onChangeCluster (clusterId) {
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

  getCDRomFileId () {
    if (this.state.cdrom.file.id !== null) {
      return this.state.cdrom.file.id
    } else {
      return this.props.vm.get('cdrom') ? this.props.vm.getIn(['cdrom', 'file', 'id']) : ''
    }
  }

  initDefaults () {
    const { clusters, templates, operatingSystems } = this.props

    const stateChange = {}
    const defaultClusterName = 'Default'

    if (!this.getCluster()) {
      const clustersList = clusters.get('clusters').toList()
      const def = (clustersList.filter(item => item.get('name') === defaultClusterName).first()) || clustersList.first()
      stateChange.clusterId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for clusterId = ${this.state.clusterId} to ${stateChange.clusterId}`)
    }

    if (!this.getTemplate()) {
      const def = templates.getIn(['templates', zeroUID]) || this.props.templates.get('templates').toList().first()
      stateChange.templateId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for templateId = ${this.state.templateId} to ${stateChange.templateId}`)
    }

    if (!this.getOS()) {
      const osList = operatingSystems.get('operatingSystems').toList()
      const def = osList.sort((a, b) => a.get('id').localeCompare(b.get('id'))).first()
      stateChange.osId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for osId = ${this.state.osId} to ${stateChange.osId}`)
    }

    this.setState(stateChange)
  }

  render () {
    const { icons, vmDialog, clusters, templates, operatingSystems, storages } = this.props
    const vm = this.props.vm
    const isoStorages = storages.get('storages').filter(v => v.get('type') === 'iso')
    const idPrefix = `vmdialog-${vm.get('name')}`

    let files = { '': { id: '', value: '[Eject]' } }

    isoStorages.toList().forEach(v => {
      if (v.get('files')) {
        v.get('files').forEach(item => {
          files[item['id']] = { id: item['id'], value: item['name'] }
        })
      }
    })

    if (this.state.saved && vmDialog.getIn(['vm', 'id'])) {
      return (<Redirect to={`/vm/${vmDialog.getIn(['vm', 'id'])}`} />)
    }

    const isEdit = !!vm

    const sortedClusters = sortedBy(clusters.get('clusters'), 'name')

    const filteredTemplates = templates.get('templates')
      .filter(template => template.get('clusterId') === this.state.clusterId || !template.get('clusterId'))
    const sortedTemplates = sortedBy(filteredTemplates, 'name')

    const sortedOSs = sortedBy(operatingSystems.get('operatingSystems'), 'description')

    const cluster = this.getCluster()
    const template = this.getTemplate()
    const os = this.getOS()
    const cdromFileId = this.getCDRomFileId()

    const submitText = isEdit ? 'Update VM' : 'Create VM'

    const iconId = vm && vm.getIn(['icons', 'small', 'id'])
    const icon = iconId && icons.get(iconId)

    const title = isEdit ? (
      <h1 className={style['header']} id={`${idPrefix}-edit-title`}>
        <VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' className={sharedStyle['vm-detail-icon']} />
        &nbsp;{vm.get('name')} - Edit
      </h1>) : (
        <h1 id={`${idPrefix}-create-title`}>Create A New Virtual Machine</h1>
      )

    return (
      <DetailContainer>
        {title}
        <ErrorAlert message={this.getLatestUserMessage()} id={`${idPrefix}-erroralert`} />
        <br />
        <form>
          <Prompt
            when={this.state.isChanged}
            message={location => (
              `Are you sure you want to go to ${location.pathname}`
            )} />

          <div className={style['vm-dialog-container']}>
            <dl className={sharedStyle['vm-properties']}>
              <dt>
                <FieldHelp content='Unique name of the virtual machine.' text='Name' />
              </dt>
              <dd>
                <input
                  type='text'
                  className='form-control'
                  id='vmName'
                  placeholder='Enter VM Name'
                  onChange={this.onChangeVmName}
                  value={this.state.name || ''} />
              </dd>

              <dt>
                <FieldHelp content='Optional user description of the virtual machine.' text='Description' />
              </dt>
              <dd>
                <input
                  type='text'
                  className='form-control'
                  id='vmDescription'
                  placeholder='Enter VM Description (optional)'
                  onChange={this.onChangeVmDescription}
                  value={this.state.description || ''} />
              </dd>

              <dt>
                <FieldHelp content='Group of hosts the virtual machine can be running on.' text='Cluster' />
              </dt>
              <dd className={style['field-overflow-visible']}>
                <SelectBox
                  onChange={this.onChangeCluster}
                  selected={cluster ? cluster.get('id') : ''}
                  items={sortedClusters.map(item => (
                    { id: item.get('id'), value: item.get('name') }
                  )).toJS()}
                  />
              </dd>

              <dt>
                <FieldHelp content='Contains the configuration and disks which will be used to create this virtual machine. Please customize as needed.' text='Template' />
              </dt>
              <dd className={style['field-overflow-visible']}>
                <SelectBox
                  onChange={this.onChangeTemplate}
                  selected={template ? template.get('id') : ''}
                  items={sortedTemplates.map(item => (
                    { id: item.get('id'), value: templateNameRenderer(item) }
                  )).toJS()}
                  />
              </dd>

              <dt>
                <FieldHelp content='Operating system installed on the virtual machine.' text='Operating System' />
              </dt>
              <dd className={style['field-overflow-visible']}>
                <SelectBox
                  onChange={this.onChangeOperatingSystem}
                  selected={os ? os.get('id') : ''}
                  items={sortedOSs.map(item => (
                    { id: item.get('id'), value: item.get('description') }
                  )).toJS()}
                  />
              </dd>

              <dt>
                <span className='pficon pficon-memory' />
                &nbsp;
                <FieldHelp content='Total memory the virtual machine will be equipped with. In megabytes.' text='Defined Memory' />
              </dt>
              <dd>
                <input
                  type='number'
                  className='form-control'
                  id='vmMemory'
                  placeholder='VM Memory'
                  onChange={this.onChangeVmMemory}
                  value={this.state.memory / 1024 / 1024 || ''}
                  min={0}
                  step={256} />
              </dd>

              <dt>
                <span className='pficon pficon-cpu' />
                &nbsp;
                <FieldHelp content='Total count of virtual processors the virtual machine will be equipped with.' text='CPUs' />
              </dt>
              <dd>
                <input
                  type='number'
                  className='form-control'
                  id='vmCpus'
                  placeholder='CPUs'
                  onChange={this.onChangeVmCpu}
                  value={this.state.cpus || ''}
                  min={1}
                  step={1} />
              </dd>
              <dt>
                <span className='pficon pficon-storage-domain' />
                &nbsp;
                <FieldHelp content='Change CD.' text='CDRom' />
              </dt>
              <dd className={style['field-overflow-visible']}>
                <SelectBox
                  onChange={this.onChangeCD}
                  selected={cdromFileId}
                  items={files}
                  />
              </dd>

            </dl>
          </div>

          <div className={style['vm-dialog-buttons']}>
            <Link className='btn btn-default' to={vm ? `/vm/${vm.get('id')}` : '/'}>Close</Link>
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
  vmDialog: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  vms: PropTypes.object.isRequired,
  storages: PropTypes.object.isRequired,

  onCloseDialog: PropTypes.func.isRequired,
  addVm: PropTypes.func.isRequired,
  updateVm: PropTypes.func.isRequired,
  onInit: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    clusters: state.clusters,
    templates: state.templates,
    operatingSystems: state.operatingSystems,
    userMessages: state.userMessages,
    vmDialog: state.VmDialog,
    icons: state.icons,
    vms: state.vms,
    storages: state.storages,
  }),
  (dispatch) => ({
    onCloseDialog: () => dispatch(closeDialog({ force: false })),
    addVm: (vm, actionUniqueId, page) => dispatch(createVm(vm, actionUniqueId, page)),
    updateVm: (vm, actionUniqueId) => dispatch(editVm(vm, actionUniqueId)),
    onInit: () => dispatch(setSavedVm({ vm: null })),
  })
)(VmDialog)
