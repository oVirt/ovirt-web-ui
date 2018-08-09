import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'

import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
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

import { createVm, editVm } from '../../actions'

import Selectors from '../../selectors'
import { MAX_VM_MEMORY_FACTOR } from '../../constants'
import { msg } from '../../intl'

const zeroUID = '00000000-0000-0000-0000-000000000000'
const FIRST_DEVICE = 0
const SECOND_DEVICE = 1
const defaultDevices = ['hd', null]

class VmDialog extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      correlationId: '',

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

  static getDerivedStateFromProps (props, state) {
    // If a user message correlating to the correlationId exists, the add/edit failed and
    // the state should still be marked as isChanged to prevent page navigation.
    if (props.userMessages.get('records').find(record => record.getIn([ 'failedAction', 'meta', 'correlationId' ]) === state.correlationId)) {
      return { isChanged: true }
    }

    return null
  }

  setUiError (name, error) {
    this.setState((prevState) => ({
      uiErrors: Object.assign({}, prevState.uiErrors, {
        [name]: error,
      }),
    }))
  }

  submitHandler (e) {
    e.preventDefault()
    const correlationId = generateUnique('vm-dialog-')
    this.props.vm
      ? this.props.updateVm(this.composeVm(), correlationId)
      : this.props.addVm(this.composeVm(), correlationId)
    this.setState({
      saved: true,
      isChanged: false,
      correlationId,
    })
  }

  getLatestUserMessage () {
    const { correlationId } = this.state
    const filtered = this.props.userMessages
      .get('records')
      .filter(record => record.getIn([ 'failedAction', 'meta', 'correlationId' ]) === correlationId)
    const last = filtered.last()

    return last && last.get('message')
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

    const vmNameErrorText = isVmNameValid(newName)
      ? null
      : msg.pleaseEnterValidVmName()
    this.setState({ name: newName, isChanged: true, vmNameErrorText })

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
      this.doChangeTemplateIdTo(zeroUID) // Careful: this.state.clusterId still contains previous clusterId, call setTimeout(function, 0) if needed otherwise
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
    const { icons, clusters, templates, storages, previousPath } = this.props
    const { bootDevices } = this.state
    const vm = this.props.vm
    const isoStorages = storages.filter(storageDomain => storageDomain.get('type') === 'iso')
    const idPrefix = `vmdialog-${vm ? vm.get('name') : '_new'}`

    let files = [{ id: '', value: '[Eject]' }]

    isoStorages.toList().forEach(storageDomain => {
      const fileList = storageDomain.get('files')
      if (fileList) {
        files.push(...fileList.map(item => (
          { id: item['id'], value: item['name'] }
        )))
      }
    })

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
      ? (<span className={`help-block ${style['error-text']}`}>{this.state.vmNameErrorText}</span>)
      : null

    return (
      <div className='detail-container'><DetailContainer>
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

      </DetailContainer></div>
    )
  }
}

/**
 * Allowed characters are: letters, numbers and '._-+'.
 *
 * See https://github.com/oVirt/ovirt-engine/blob/89449b50aff6d137c28a4249f2c374f42b003a6d/frontend/webadmin/modules/uicommonweb/src/main/java/org/ovirt/engine/ui/uicommonweb/validation/I18NNameValidation.java#L23
 */
function isVmNameValid (nameCandidate) {
  const asciiLetters = 'a-zA-Z'
  const unicodeNonAsciiLetters = '\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC'
  const numbers = '0-9'
  const specialCharacters = '._-'
  const regexpString = '^([' + asciiLetters + unicodeNonAsciiLetters + numbers + specialCharacters + '])+$'
  const regexp = new RegExp(regexpString)
  return regexp.test(nameCandidate)
}

VmDialog.propTypes = {
  vm: PropTypes.object, // optional, VM object to edit

  clusters: PropTypes.object.isRequired, // deep immutable, {[id: string]: Cluster}
  templates: PropTypes.object.isRequired, // deep immutable, {[id: string]: Template}
  operatingSystems: PropTypes.object.isRequired, // deep immutable, {[id: string]: OperatingSystem}
  userMessages: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  storages: PropTypes.object.isRequired, // deep immutable, {[id: string]: StorageDomain}
  previousPath: PropTypes.string.isRequired,

  addVm: PropTypes.func.isRequired,
  updateVm: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    clusters: state.clusters,
    templates: state.templates,
    operatingSystems: state.operatingSystems,
    userMessages: state.userMessages,
    icons: state.icons,
    storages: state.storageDomains,
  }),
  (dispatch) => ({
    addVm: (vm, correlationId) => dispatch(createVm({ vm, transformInput: true, pushToDetailsOnSuccess: true }, { correlationId })),
    updateVm: (vm, correlationId) => dispatch(editVm({ vm, transformInput: true }, { correlationId })),
  })
)(VmDialog)
