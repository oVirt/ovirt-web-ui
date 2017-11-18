import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'

import { connect } from 'react-redux'
import { Redirect, Link } from 'react-router-dom'
import NavigationPrompt from 'react-router-navigation-prompt'
import Switch from 'react-bootstrap-switch'

import { logDebug, generateUnique, templateNameRenderer } from '../../helpers'
import { isRunning, getVmIconId, isValidOsIcon } from '../utils'

import style from './style.css'
import sharedStyle from '../sharedStyle.css'

import CloudInitEditor from '../CloudInitEditor'
import DetailContainer from '../DetailContainer'
import IconUpload from './IconUpload'
import ErrorAlert from '../ErrorAlert'
import FieldHelp from '../FieldHelp'
import NavigationConfirmationModal from '../NavigationConfirmationModal'
import SelectBox from '../SelectBox'
import VmIcon from '../VmIcon'

import Selectors from '../../selectors'

import { editVm, createVm, setSavedVm } from './actions'

import { MAX_VM_MEMORY_FACTOR } from '../../constants/index'

import { msg } from '../../intl'

import { msg } from '../../intl'

const zeroUID = '00000000-0000-0000-0000-000000000000'
const FIRST_DEVICE = 0
const SECOND_DEVICE = 1
const defaultDevices = ['hd', null]

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
      bootDevices: defaultDevices,
      saved: false,
      isChanged: false,
      bootMenuEnabled: false,
      cloudInit: {
        enabled: false,
        hostName: '',
        sshAuthorizedKeys: '',
      },

      icon: {
        id: undefined,
        mediaType: undefined,
        data: undefined,
      },

      uiErrors: {
        icon: undefined,
      },
    }

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
    this.onChangeBootMenuEnabled = this.onChangeBootMenuEnabled.bind(this)
    this.onChangeBootDevice = this.onChangeBootDevice.bind(this)

    this.handleCloudInitChange = this.handleCloudInitChange.bind(this)
    this.onIconChange = this.onIconChange.bind(this)
    this.setUiError = this.setUiError.bind(this)
  }

  componentWillMount () {
    this.props.onInit()
  }

  componentDidMount () {
    const vm = this.props.vm
    if (vm) { // 'edit' mode
      const bootDevices = vm.getIn(['os', 'bootDevices']).toJS()

      const resultDevices = []

      for (let i = 0; i < defaultDevices.length; i++) {
        resultDevices.push(bootDevices[i] ? bootDevices[i] : defaultDevices[i])
      }

      this.setState({
        id: vm.get('id'),
        name: vm.get('name'),
        description: vm.get('description'),
        cpus: vm.getIn(['cpu', 'vCPUs']),
        memory: vm.getIn(['memory', 'total']),

        clusterId: vm.getIn(['cluster', 'id']),
        templateId: vm.getIn(['template', 'id']),
        osId: this.getOsIdFromType(vm.getIn(['os', 'type'])),
        bootDevices: resultDevices,
        cdrom: {
          file: {
            id: null,
          },
        },
        bootMenuEnabled: vm.get('bootMenuEnabled'),
        cloudInit: vm.get('cloudInit').toJS(),
        icon: {
          id: getVmIconId(this.props.operatingSystems, vm),
          mediaType: undefined,
          data: undefined,
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

  setUiError (name, error) {
    this.setState((prevState) => ({
      uiErrors: Object.assign({}, prevState.uiErrors, {
        [name]: error,
      }),
    }))
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
        'type': os ? os.get('name') : null,
        'bootDevices': this.state.bootDevices || [],
      },
      'cpu': {
        'topology': {
          'cores': '1', // TODO: fix to conform topology in template!
          'sockets': this.state.cpus || 1,
          'threads': '1',
        },
      },
      bootMenuEnabled: this.state.bootMenuEnabled,
      cloudInit: this.state.cloudInit,
      'status': this.props.vm ? this.props.vm.get('status') : '',
      icons: {
        large: {
          id: this.state.icon.id,
          media_type: this.state.icon.id ? undefined : this.state.icon.mediaType,
          data: this.state.icon.id ? undefined : this.state.icon.data,
        },
      },
    }
  }

  onChangeVmName (event) {
    const newName = event.target.value
    var regexp = /^[a-zA-Z0-9._\-+]+$/;

    if (regexp.test(newName)) {
      this.setState({ name: newName, isChanged: true, vmNameErrorText: null })}
    else {
      this.setState({ name: newName, isChanged: true, vmNameErrorText: msg.pleaseEnterValidVmName()})
    }

    const template = this.getTemplate()
    if (!template) {
      return
    }
    const templateHostName = template.getIn(['cloudInit', 'hostName'])
    if (templateHostName) {
      return
    }
    this.setState(state => { state.cloudInit.hostName = newName })
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
    const os = this.props.operatingSystems.get(osId)
    if (os) {
      this.onChangeOsIconId(os.getIn(['icons', 'large', 'id']))
    }
    this.setState({
      osId,
      isChanged: true,
    })
  }

  onChangeOsIconId (iconId) {
    if (this.state.icon.id && isValidOsIcon(this.props.operatingSystems, this.state.icon.id)) { // change unless custom icon is selected
      this.doChangeIconId(iconId)
    }
  }

  doChangeIconId (iconId) {
    this.setUiError('icon')
    this.setState({
      icon: {
        id: iconId,
      },
      isChanged: true,
    })
  }

  onIconChange (icon) {
    if (icon) {
      this.setUiError('icon')
      this.setState({
        icon,
        isChanged: true,
      })
    } else {
      // set default os icon
      const os = this.getOS()
      if (os) {
        this.doChangeIconId(os.getIn(['icons', 'large', 'id']))
      }
    }
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
      const os = this.props.operatingSystems.get(osId)
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
    let { memory, cpus, osId, cloudInit, bootMenuEnabled } = this.state

    if (template) {
      memory = template.get('memory')
      cpus = template.getIn(['cpu', 'topology', 'cores'], 1) * template.getIn(['cpu', 'topology', 'sockets'], 1) * template.getIn(['cpu', 'topology', 'threads'], 1)

      osId = this.getOsIdFromType(template.getIn(['os', 'type'], 'Blank'))
      cloudInit = template.get('cloudInit').toJS()
      bootMenuEnabled = template.get('bootMenuEnabled')
    }

    this.setState({
      templateId,
      memory,
      cpus,
      isChanged: true,
      cloudInit,
      bootMenuEnabled,
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
      const template = this.props.templates.get(templateId)
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

  onChangeBootMenuEnabled (switchComponent, value) {
    this.setState({ bootMenuEnabled: value })
  }

  /**
   * @returns cluster object conforming this.state.clusterId
   */
  getCluster () {
    const clusterId = this.state.clusterId
    if (clusterId) {
      const cluster = this.props.clusters.get(clusterId)
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
      const clustersList = clusters.toList()
      const def = (clustersList.filter(item => item.get('name') === defaultClusterName).first()) || clustersList.first()
      stateChange.clusterId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for clusterId = ${this.state.clusterId} to ${stateChange.clusterId}`)
    }

    if (!this.getTemplate()) {
      const def = templates.get(zeroUID) || this.props.templates.toList().first()
      stateChange.templateId = def ? def.get('id') : undefined
      logDebug(`VmDialog initDefaults(): Setting initial value for templateId = ${this.state.templateId} to ${stateChange.templateId}`)
    }

    if (!this.getOS()) {
      const osList = operatingSystems.toList()
      const os = osList.sort((a, b) => a.get('id').localeCompare(b.get('id'))).first()
      if (os) {
        stateChange.osId = os.get('id')
        stateChange.icon = {
          id: os.getIn(['icons', 'large', 'id']),
        }
      }
      logDebug(`VmDialog initDefaults(): Setting initial value for osId = ${this.state.osId} to ${stateChange.osId}`)
    }

    this.setState(stateChange)
  }

  handleCloudInitChange (key) {
    return (value) => {
      this.setState((prevState) => {
        return { cloudInit: Object.assign({}, prevState.cloudInit, { [key]: value }) }
      })
    }
  }

  onChangeBootDevice (id) {
    return (device) => {
      this.setState((prevState) => {
        const copiedDevices = prevState.bootDevices.slice()
        copiedDevices[id] = device
        for (let i = id + 1; i < copiedDevices.length; i++) {
          copiedDevices[i] = copiedDevices[i] === device ? null : copiedDevices[i]
        }
        return { bootDevices: copiedDevices }
      })
    }
  }

  render () {
    const { icons, vmDialog, clusters, templates, storages, previousPath } = this.props
    const { bootDevices } = this.state
    const vm = this.props.vm
    const isoStorages = storages.get('storages').filter(v => v.get('type') === 'iso')
    const idPrefix = `vmdialog-${vm ? vm.get('name') : '_new'}`

    let files = [{ id: '', value: '[Eject]' }]

    isoStorages.toList().forEach(v => {
      const fileList = v.get('files')
      if (fileList) {
        files.push(...fileList.map(item => (
          { id: item['id'], value: item['name'] }
        )))
      }
    })

    if (this.state.saved && vmDialog.getIn(['vm', 'id'])) {
      return (<Redirect to={`/vm/${vmDialog.getIn(['vm', 'id'])}`} />)
    }

    const isEdit = !!vm
    const isUp = (isEdit && isRunning(vm.get('status')))

    const filteredTemplates = templates
      .filter(template => template.get('clusterId') === this.state.clusterId || !template.get('clusterId'))

    const cluster = this.getCluster()
    const architecture = cluster && cluster.get('architecture')

    const osMap = Selectors.getOperatingSystemsByArchitecture(architecture)
    const os = this.getOS()

    const template = this.getTemplate()

    const cdromFileId = this.getCDRomFileId()

    const submitText = isEdit ? msg.updateVm() : msg.createVm()

    const allowedBootDevices = ['hd', 'network', 'cdrom']
    const dialogHeader = isEdit ? `${vm.get('name')} - ${msg.edit()}` : msg.createANewVm()

    const icon = this.state.icon.id ? icons.get(this.state.icon.id) : Immutable.fromJS(this.state.icon)

    const bootMenuHint = isUp
      ? (<React.Fragment>
        {msg.bootMenuTooltip()}
        <br />
        <span className='pficon pficon-warning-triangle-o' />
        &nbsp;
        {msg.bootMenuWarning()}
      </React.Fragment>)
      : msg.bootMenuTooltip()
    
    const vmNameError = this.state.vmNameErrorText
      ? (<span className={`help-block ${style['error-text']}`} >{this.state.vmNameErrorText}</span>)
      : null

    return (
      <DetailContainer>
        <h1 className={style['header']} id={`${idPrefix}-${isEdit ? 'edit' : 'create'}-title`}>
          <VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' />
          &nbsp;{dialogHeader}
        </h1>
        {this.getLatestUserMessage() && (<ErrorAlert message={this.getLatestUserMessage()} id={`${idPrefix}-erroralert`} />)}
        <br />
        <form>
          <NavigationPrompt when={this.state.isChanged}>
            {({ isActive, onConfirm, onCancel }) => (
              <NavigationConfirmationModal show={isActive} onYes={onConfirm} onNo={onCancel} />
            )}
          </NavigationPrompt>

          <div className={style['vm-dialog-container']}>
            <dl className={sharedStyle['vm-properties']}>
              <dt>
                <FieldHelp content={msg.uniqueNameOfTheVirtualMachine()} text={msg.name()} />
              </dt>
              <dd className={this.state.vmNameErrorText ? 'has-error' : ''}>
                <input
                  type='text'
                  className='form-control'
                  id='vmName'
                  placeholder={msg.enterVmName()}
                  onChange={this.onChangeVmName}
                  value={this.state.name || ''} />
                  {vmNameError}
              </dd>

              <dt>
                <FieldHelp content={msg.optionalUserDescriptionOfVm()} text={msg.description()} />
              </dt>
              <dd>
                <input
                  type='text'
                  className='form-control'
                  id='vmDescription'
                  placeholder={msg.enterVmDescription()}
                  onChange={this.onChangeVmDescription}
                  value={this.state.description || ''} />
              </dd>

              <dt>
                <FieldHelp content={msg.groupOfHostsVmCanBeRunningOn()} text={msg.cluster()} />
              </dt>
              <dd className={style['field-overflow-visible']}>
                <SelectBox
                  onChange={this.onChangeCluster}
                  selected={cluster ? cluster.get('id') : ''}
                  idPrefix='select-cluster'
                  sort
                  items={clusters.toList().map(item => (
                    { id: item.get('id'), value: item.get('name') }
                  )).toJS()}
                />
              </dd>

              <dt>
                <FieldHelp content={msg.containsConfigurationAndDisksWhichWillBeUsedToCreateThisVm()} text={msg.template()} />
              </dt>
              <dd className={style['field-overflow-visible']}>
                <SelectBox
                  onChange={this.onChangeTemplate}
                  selected={template ? template.get('id') : ''}
                  idPrefix='select-template'
                  sort
                  items={filteredTemplates.toList().map(item => (
                    { id: item.get('id'), value: templateNameRenderer(item) }
                  )).toJS()}
                />
              </dd>

              <dt>
                <FieldHelp content={msg.operatingSystemInstalledOnVm()} text={msg.operatingSystem()} />
              </dt>
              <dd className={style['field-overflow-visible']}>
                <SelectBox
                  onChange={this.onChangeOperatingSystem}
                  selected={os ? os.get('id') : ''}
                  idPrefix='select-os'
                  sort
                  items={osMap.toList().map(item => (
                    { id: item.get('id'), value: item.get('description') }
                  )).toJS()}
                />
              </dd>

              <dt>
                <span className='pficon pficon-memory' />
                &nbsp;
                <FieldHelp content={msg.totalMemoryVmWillBeEquippedWith()} text={msg.definedMemory()} />
              </dt>
              <dd>
                <input
                  type='number'
                  className='form-control'
                  id='vmMemory'
                  placeholder={msg.vmMemory()}
                  onChange={this.onChangeVmMemory}
                  value={this.state.memory / 1024 / 1024 || ''}
                  min={0}
                  step={256} />
              </dd>

              <dt>
                <span className='pficon pficon-cpu' />
                &nbsp;
                <FieldHelp content={msg.totalCountOfVirtualProcessorsVmWillBeEquippedWith()} text={msg.cpus()} />
              </dt>
              <dd>
                <input
                  type='number'
                  className='form-control'
                  id='vmCpus'
                  placeholder={msg.cpus()}
                  onChange={this.onChangeVmCpu}
                  value={this.state.cpus || ''}
                  min={1}
                  step={1} />
              </dd>
              { isEdit && (
                <div> {/* this <div> is ugly anti-pattern and should be replaced by React.Fragment as soon as upgraded to React 16 */}
                  <dt>
                    <span className='pficon pficon-storage-domain' />
                    &nbsp;
                    <FieldHelp content={msg.changeCd()} text={msg.cd()} />
                  </dt>
                  <dd className={style['field-overflow-visible']}>
                    <SelectBox
                      onChange={this.onChangeCD}
                      idPrefix='select-changecd'
                      selected={cdromFileId}
                      sort
                      items={files}
                    />
                  </dd>
                </div>
              )}

              <dt>
                {
                  (isUp && vm.get('bootMenuEnabled') !== this.state.bootMenuEnabled) &&
                  <span className={'pficon pficon-warning-triangle-o ' + style['space-right']} />
                }
                <FieldHelp content={bootMenuHint} text={msg.bootMenu()} />
              </dt>
              <dd>
                <Switch
                  animate
                  bsSize='mini'
                  value={!!this.state.bootMenuEnabled}
                  onChange={this.onChangeBootMenuEnabled}
                />
              </dd>
              <dt>
                <FieldHelp content={msg.bootSequenceTooltip()} text={msg.bootSequence()} />
              </dt>
              <dd />
              <div>
                <dt className={style['field-shifted']}>
                  <FieldHelp content={msg.firstDeviceTooltip()} text={msg.firstDevice()} />
                </dt>
                <dd className={style['field-overflow-visible']}>
                  <SelectBox
                    onChange={this.onChangeBootDevice(FIRST_DEVICE)}
                    selected={bootDevices[FIRST_DEVICE]}
                    idPrefix='select-first-device'
                    items={allowedBootDevices.map(item => (
                      { id: item, value: msg[`${item}Boot`]() }
                    ))}
                  />
                </dd>
                <dt className={style['field-shifted']}>
                  <FieldHelp content={msg.secondDeviceTooltip()} text={msg.secondDevice()} />
                </dt>
                <dd className={style['field-overflow-visible']}>
                  <SelectBox
                    onChange={this.onChangeBootDevice(SECOND_DEVICE)}
                    selected={bootDevices[SECOND_DEVICE]}
                    idPrefix='select-second-device'
                    items={[{ id: null, value: '[None]' }, ...allowedBootDevices.filter(item => (
                      item !== bootDevices[FIRST_DEVICE]
                    )).map(item => (
                      { id: item, value: msg[`${item}Boot`]() }
                    ))]}
                  />
                </dd>
              </div>

              <CloudInitEditor
                enabled={this.state.cloudInit.enabled}
                hostName={this.state.cloudInit.hostName}
                sshAuthorizedKeys={this.state.cloudInit.sshAuthorizedKeys}
                onEnabledChange={this.handleCloudInitChange('enabled')}
                onHostNameChange={this.handleCloudInitChange('hostName')}
                onSshAuthorizedKeysChange={this.handleCloudInitChange('sshAuthorizedKeys')}
              />
              <IconUpload
                onIconChange={this.onIconChange}
                onErrorChange={(error) => this.setUiError('icon', error)}
                error={this.state.uiErrors.icon} />
            </dl>
          </div>

          <div className={style['vm-dialog-buttons']}>
            <Link id='button-close' className='btn btn-default' to={previousPath}>{msg.close()}</Link>
            <button id='button-submit' className='btn btn-primary' type='button' onClick={this.submitHandler}>{submitText}</button>
          </div>
        </form>

      </DetailContainer>
    )
  }
}

VmDialog.propTypes = {
  vm: PropTypes.object, // optional, VM object to edit

  clusters: PropTypes.object.isRequired, // deep immutable, {[id: string]: Cluster}
  templates: PropTypes.object.isRequired, // deep immutable, {[id: string]: Template}
  operatingSystems: PropTypes.object.isRequired, // deep immutable, {[id: string]: OperatingSystem}
  userMessages: PropTypes.object.isRequired,
  vmDialog: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  vms: PropTypes.object.isRequired,
  storages: PropTypes.object.isRequired,
  previousPath: PropTypes.string.isRequired,

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
    addVm: (vm, actionUniqueId, page) => dispatch(createVm(vm, actionUniqueId, page)),
    updateVm: (vm, actionUniqueId) => dispatch(editVm(vm, actionUniqueId)),
    onInit: () => dispatch(setSavedVm({ vm: null })),
  })
)(VmDialog)
