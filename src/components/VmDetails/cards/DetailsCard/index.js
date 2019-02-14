import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { List } from 'immutable'

import * as Actions from '_/actions'
import { MAX_VM_MEMORY_FACTOR } from '_/constants'
import { generateUnique, localeCompare, filterOsByArchitecture } from '_/helpers'
import { msg, enumMsg } from '_/intl'

import {
  convertValue,
  isNumber,
  round,
} from '_/utils'
import {
  canChangeCluster as vmCanChangeCluster,
  canChangeCd as vmCanChangeCd,
} from '_/vm-status'

import { isValidOsIcon } from '../../../utils'

import {
  Alert,
  FieldLevelHelp,
  FormControl,
  Icon,
  OverlayTrigger,
  Tooltip,
  ControlLabel,
  FormGroup,
} from 'patternfly-react'
import Switch from '../../../Switch'
import SelectBox from '../../../SelectBox'
import BaseCard from '../../BaseCard'
import { Grid, Row, Col } from '../../GridComponents'

import style from './style.css'

import ConsoleList from './ConsoleList'
import HotPlugChangeConfirmationModal from './HotPlugConfirmationModal'
import NextRunChangeConfirmationModal from './NextRunChangeConfirmationModal'

import ExpandCollapseSection from '../../../ExpandCollapseSection'

/*
 * Return a normalized list of iso files from the set of provided storage domains.
 */
function createIsoList (storageDomains) {
  const list = []

  storageDomains.forEach(storageDomain => {
    if (storageDomain.has('files')) {
      storageDomain.get('files').forEach(file => {
        list.push({
          sd: {
            id: storageDomain.get('id'),
            name: storageDomain.get('name'),
          },
          file: {
            id: file.id,
            name: file.name,
          },
        })
      })
    }
  })

  return list
}

/*
 * Return a normalized and sorted list of clusters ready for use in a __SelectBox__ from
 * the Map of provided clusters.
 */
function createClusterList (clusters) {
  const clusterList =
    clusters
      .toList()
      .filter(cluster => cluster.get('canUserUseCluster'))
      .map(cluster => ({
        id: cluster.get('id'),
        value: cluster.get('name'),
        datacenter: cluster.get('dataCenterId'),
      }))
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return clusterList
}

/*
 * Return a normalized and sorted list of templates ready for use in a __SelectBox__ from
 * the Map of provided templates.
 */
function createTemplateList (templates) {
  const templateList =
    templates
      .toList()
      .map(template => ({
        id: template.get('id'),
        value: template.get('name'),
      }))
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return templateList
}

/*
 * Return a normalized and sorted list of OS ready for use in a __SelectBox__ from
 * the Map of provided templates.
 */
function createOsList (vm, clusters, operatingSystems) {
  const clusterId = vm.getIn(['cluster', 'id'])
  const cluster = clusters && clusters.get(clusterId)
  const architecture = cluster && cluster.get('architecture')
  const osList =
    filterOsByArchitecture(operatingSystems, architecture)
      .toList()
      .map(os => (
        {
          id: os.get('id'),
          value: os.get('description'),
        }
      ))
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return osList
}

function rephraseVmType (vmType) {
  const types = {
    'desktop': msg.vmType_desktop(),
    'server': msg.vmType_server(),
    'highperformance': msg.vmType_highPerformance(),
  }

  const type = vmType.toLowerCase()
  if (type in types) {
    return types[type]
  }

  return vmType
}

/*
 * Render a label plus children as a single grid row with 2 columns.
 */
const FieldRow = ({ label, children, id }) => (
  <Row className={style['field-row']}>
    <Col cols={5} className={style['col-label']}>{label}</Col>
    <Col cols={7} className={style['col-data']} id={id}>{children}</Col>
  </Row>
)
FieldRow.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

/*
 * Render "N/A" with an optional tooltip for any field that won't have a value
 * based on the state of the VM.
 */
const NotAvailable = ({ tooltip, id }) => (
  <div>
    { tooltip
      ? (
        <OverlayTrigger overlay={<Tooltip id={id}>{tooltip}</Tooltip>}>
          <span>{msg.notAvailable()}</span>
        </OverlayTrigger>
      )
      : (
        <span id={id}>{msg.notAvailable()}</span>
      )
    }
  </div>
)
NotAvailable.propTypes = {
  tooltip: PropTypes.string,
  id: PropTypes.string.isRequired,
}

const DEFAULT_BOOT_DEVICES = List(['hd', null])

/*
 * Specific information and details of the VM (status/up-time, data center, cluster,
 * host, template, IP addresses, FQDN, CD, consoles, memory, CPUs, cloud-init, boot menu,
 * boot order)
 */
class DetailsCard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      vm: props.vm, // ImmutableJS Map

      isEditing: false,
      isDirty: false,
      correlationId: null,
      correlatedMessages: null,

      promptHotPlugChanges: false,
      promptNextRunChanges: false,

      isoList: createIsoList(props.storageDomains),
      clusterList: createClusterList(props.clusters),
      templateList: createTemplateList(props.templates),
      osList: createOsList(props.vm, props.clusters, props.operatingSystems),
    }
    this.trackUpdates = {}
    this.hotPlugUpdates = {}
    this.hotPlugNow = true
    this.nextRunUpdates = {}
    this.restartAfterSave = false

    this.handleCardOnStartEdit = this.handleCardOnStartEdit.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleCardOnCancel = this.handleCardOnCancel.bind(this)
    this.handleCardOnSave = this.handleCardOnSave.bind(this)

    this.handleNextRunOnCancel = this.handleNextRunOnCancel.bind(this)
    this.handleNextRunOnSave = this.handleNextRunOnSave.bind(this)
    this.handleNextRunOnSaveAndRestart = this.handleNextRunOnSaveAndRestart.bind(this)
    this.handleHotPlugOnCancel = this.handleHotPlugOnCancel.bind(this)
    this.handleHotPlugOnApplyLater = this.handleHotPlugOnApplyLater.bind(this)
    this.handleHotPlugOnApplyNow = this.handleHotPlugOnApplyNow.bind(this)

    this.updateOs = this.updateOs.bind(this)
  }

  static getDerivedStateFromProps (props, state) {
    if (!state.isEditing) {
      return {
        vm: props.vm,
      }
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

    // NOTE: Doing the following here instead of getDerivedStateFromProps so __clusters__,
    //       __storageDomains__, and __templates__ don't need to be kept in state for
    //       change comparison
    if (prevProps.clusters !== this.props.clusters) {
      this.setState({ clusterList: createClusterList(this.props.clusters) }) // eslint-disable-line react/no-did-update-set-state
    }

    if (prevProps.storageDomains !== this.props.storageDomains) {
      this.setState({ isoList: createIsoList(this.props.storageDomains) }) // eslint-disable-line react/no-did-update-set-state
    }

    if (prevProps.templates !== this.props.templates) {
      this.setState({ templateList: createTemplateList(this.props.templates) }) // eslint-disable-line react/no-did-update-set-state
    }

    if (prevProps.operatingSystems !== this.props.operatingSystems ||
      prevProps.clusters !== this.props.clusters ||
      prevProps.vm.getIn(['cluster', 'id']) !== this.props.vm.getIn(['cluster', 'id'])
    ) {
      this.setState({ osList: createOsList(this.props.vm, this.props.clusters, this.props.operatingSystems) }) // eslint-disable-line react/no-did-update-set-state
    }
  }

  handleCardOnStartEdit () {
    this.trackUpdates = {}
    this.hotPlugUpdates = {}
    this.nextRunUpdates = {}
    this.setState({
      isEditing: true,
      isDirty: false,
      correlationId: null,
      correlatedMessages: null,
      promptHotPlugChanges: false,
      promptNextRunChanges: false,
    })
    this.props.onEditChange(true)
  }

  updateOs (updates, os) {
    if (os) {
      const operatingSystems = this.props.operatingSystems
      updates = updates.mergeDeep({
        os: {
          type: os.get('name'),
        },
      })

      const osIconId = os.getIn(['icons', 'large', 'id'])
      const currentOsIconId = updates.getIn(['icons', 'large', 'id'])
      if (currentOsIconId && isValidOsIcon(operatingSystems, currentOsIconId)) {
        updates = updates.mergeDeep({
          icons: {
            large: {
              id: osIconId,
            },
          },
        })
      }
    }
    return updates
  }

  handleChange (fieldName, value, additionalArgs) {
    if (this.state.isEditing && !this.state.isDirty) {
      this.props.onEditChange(true, true)
    }

    let updates = this.state.vm
    const changeQueue = [{ fieldName, value }]
    for (let change = changeQueue.shift(); change; change = changeQueue.shift()) {
      console.log('processing change', change)
      const { fieldName, value } = change

      let fieldUpdated
      switch (fieldName) {
        case 'cluster':
          updates = updates.set('cluster', this.props.clusters.get(value))
          fieldUpdated = 'cluster'

          // Change the template to 'Blank' if the VM's template isn't in the new cluster
          {
            const template = this.props.templates.get(updates.getIn(['template', 'id']))
            if (template && template.get('clusterId') && template.get('clusterId') !== value) {
              changeQueue.push({ fieldName: 'template', value: this.props.blankTemplateId })
            }
          }
          break

        case 'template':
          updates = updates.set('template', this.props.templates.get(value))
          fieldUpdated = 'template'

          // Apply settings from the template to the VM (memory, CPUs, OS, cloudInit, bootMenuEnabled)
          {
            const template = this.props.templates.get(value)
            if (template) {
              const templateOsType = template.getIn(['os', 'type'], 'other')
              const templateOs = this.props.operatingSystems.find(os => os.get('type') === templateOsType)

              // fields that are editable on the card
              changeQueue.push(
                { fieldName: 'memory', value: template.get('memory') / (1024 ** 3) }, // input assumed to be GiB
                { fieldName: 'cpu', value: template.getIn(['cpu', 'vCPUs']) },
                { fieldName: 'bootMenuEnabled', value: template.get('bootMenuEnabled') },
                { fieldName: 'os', value: templateOs && templateOs.get('id') },
                { fieldName: 'cloudInitEnabled', value: template.getIn(['cloudInit', 'enabled']) },
                { fieldName: 'cloudInitHostName', value: template.getIn(['cloudInit', 'hostName']) },
                { fieldName: 'cloudInitSshAuthorizedKeys', value: template.getIn(['cloudInit', 'sshAuthorizedKeys']) },
              )
            }
          }
          break

        case 'cdrom':
          updates = updates.setIn(['cdrom', 'fileId'], value)
          fieldUpdated = 'cdrom'
          break

        case 'bootMenuEnabled':
          updates = updates.set('bootMenuEnabled', value)
          fieldUpdated = 'bootMenuEnabled'
          this.nextRunUpdates['bootMenuEnabled'] = true
          // TODO? If the switch gets changed twice and it's back to its original state,
          //       should it get flagged as a change?
          break

        case 'cloudInitEnabled':
          updates = updates.setIn(['cloudInit', 'enabled'], value)
          fieldUpdated = 'cloudInit'
          break

        case 'cloudInitHostName':
          updates = updates.setIn(['cloudInit', 'hostName'], value)
          fieldUpdated = 'cloudInit'
          break

        case 'cloudInitSshAuthorizedKeys':
          updates = updates.setIn(['cloudInit', 'sshAuthorizedKeys'], value)
          fieldUpdated = 'cloudInit'
          break

        case 'os':
          fieldUpdated = 'os'
          const operatingSystems = this.props.operatingSystems
          const os = operatingSystems.find(os => os.get('id') === value)
          updates = this.updateOs(updates, os)
          break

        case 'bootDevices':
          const copiedDevices = updates.getIn(['os', 'bootDevices'], DEFAULT_BOOT_DEVICES).toJS()
          copiedDevices[additionalArgs.device] = value

          for (let i = additionalArgs.device + 1; i < copiedDevices.length; i++) {
            copiedDevices[i] = copiedDevices[i] === value ? null : copiedDevices[i]
          }

          updates = updates.setIn(['os', 'bootDevices'], List(copiedDevices))
          fieldUpdated = 'bootDevices'
          this.nextRunUpdates['bootDevices'] = true
          break

        case 'cpu':
          if (isNumber(value) && value > 0) {
            updates = updates.mergeDeep({
              'cpu': {
                'topology': { // NOTE: this may not match VM's template's topology
                  'sockets': +value,
                  'cores': 1,
                  'threads': 1,
                },
                'vCPUs': +value, // === sockets * cores * threads
              },
            })
            fieldUpdated = 'cpu'
            this.hotPlugUpdates['cpu'] = true
          }
          break

        case 'memory':
          if (isNumber(value) && value > 0) {
            const asBytes = value * (1024 ** 3) // input assumed to be GiB
            updates = updates.setIn(['memory', 'total'], asBytes)
            fieldUpdated = 'memory'
            this.hotPlugUpdates['memory'] = true
          }
          break
      }

      if (updates !== this.state.vm) {
        this.trackUpdates[fieldUpdated] = true
        this.setState({ vm: updates, isDirty: true })
      }
    } // for
  }

  handleCardOnCancel () {
    this.setState({ isEditing: false, isDirty: false, correlationId: null, correlatedMessages: null })
    this.props.onEditChange(false)
  }

  handleCardOnSave () {
    const isVmRunning = this.props.vm.get('status') === 'up'

    if (Object.keys(this.trackUpdates).length === 0) {
      this.handleCardOnCancel()
      return
    }

    // Prompt on the hot-plug field changes. The answer there will update state and run this function again
    if (isVmRunning && Object.values(this.hotPlugUpdates).find(value => value)) {
      this.setState({ promptHotPlugChanges: true })
      return
    }

    // Prompt on the next-run field changes. The answer there will update state and run this function again
    if (isVmRunning && Object.values(this.nextRunUpdates).find(value => value)) {
      this.setState({ promptNextRunChanges: true })
      return
    }

    const { vm: stateVm } = this.state
    const correlationId = generateUnique('DetailsCard-save_')

    // --- Create a partial VM (in the internal format expected by editVm() saga),
    //     only including the fields that have been updated
    const vmUpdates = { id: stateVm.get('id') }

    if (this.trackUpdates['cluster']) {
      vmUpdates['cluster'] = {
        id: stateVm.getIn([ 'cluster', 'id' ]),
      }
    }

    if (this.trackUpdates['template']) {
      vmUpdates['template'] = {
        id: stateVm.getIn([ 'template', 'id' ]),
      }
    }

    // NOTE: The cdrom change could be spun off to its own redux dispatch, but doing so would
    //       complicate the correlation tracking that needs to be done (2 changes to track
    //       instead of one).  Right now, if only the CD is changed, 2 calls will still be
    //       made.  First an editVm with an empty change.  Second the changeCd.
    if (this.trackUpdates['cdrom']) {
      vmUpdates['cdrom'] = {
        fileId: stateVm.getIn(['cdrom', 'fileId']),
      }
    }

    if (this.trackUpdates['bootMenuEnabled']) {
      vmUpdates['bootMenuEnabled'] = stateVm.get('bootMenuEnabled')
    }

    if (this.trackUpdates['cloudInit']) {
      vmUpdates['cloudInit'] = stateVm.get('cloudInit').toJS()
    }

    if (this.trackUpdates['bootDevices']) {
      vmUpdates['os'] = {
        bootDevices: stateVm.getIn(['os', 'bootDevices']).toJS(),
      }
    }

    if (this.trackUpdates['cpu']) {
      vmUpdates['cpu'] = {
        topology: stateVm.getIn(['cpu', 'topology']).toJS(),
      }
    }

    if (this.trackUpdates['os']) {
      if (!vmUpdates['os']) {
        vmUpdates['os'] = {}
      }
      vmUpdates['os'].type = stateVm.getIn(['os', 'type'])
    }

    if (this.trackUpdates['memory']) {
      const cluster = this.props.clusters.get(stateVm.getIn(['cluster', 'id']))
      const stateMemory = stateVm.getIn(['memory', 'total'])
      const overCommitPercent = cluster && cluster.getIn(['memoryPolicy', 'overCommitPercent'])
      const guaranteed = overCommitPercent ? (stateMemory * (100 / overCommitPercent)) : stateMemory

      vmUpdates['memory'] = stateMemory
      vmUpdates['memory_policy'] = {
        'max': stateMemory * MAX_VM_MEMORY_FACTOR,
        'guaranteed': Math.round(guaranteed),
      }
    }

    // ---- dispatch the save
    this.setState({ correlationId })
    this.props.saveChanges(
      vmUpdates,
      this.restartAfterSave,
      !this.hotPlugNow,
      correlationId)

    return false // control BaseCard's view/edit transition
  }

  handleNextRunOnCancel () {
    this.setState({ promptNextRunChanges: false })
  }

  handleNextRunOnSave () {
    this.nextRunUpdates = {}
    this.restartAfterSave = false
    this.setState({ promptNextRunChanges: false })
    this.handleCardOnSave()
  }

  handleNextRunOnSaveAndRestart () {
    this.nextRunUpdates = {}
    this.restartAfterSave = true
    this.setState({ promptNextRunChanges: false })
    this.handleCardOnSave()
  }

  handleHotPlugOnCancel () {
    this.setState({ promptHotPlugChanges: false })
  }

  handleHotPlugOnApplyLater () {
    this.hotPlugUpdates = {}
    this.hotPlugNow = false
    this.setState({ promptHotPlugChanges: false })
    this.handleCardOnSave()
  }

  handleHotPlugOnApplyNow () {
    this.hotPlugUpdates = {}
    this.hotPlugNow = true
    this.setState({ promptHotPlugChanges: false })
    this.handleCardOnSave()
  }

  render () {
    const { hosts, clusters, dataCenters, templates, operatingSystems } = this.props
    const { vm, isEditing, correlatedMessages, clusterList, isoList, templateList } = this.state

    const idPrefix = 'vmdetail-details'

    const isPoolVm = vm.getIn(['pool', 'id']) !== undefined
    const canEditDetails = vm.get('canUserEditVm') && !isPoolVm
    const status = vm.get('status')

    // Host Name
    const hostName = hosts && hosts.getIn([vm.get('hostId'), 'name'])

    // IP Addresses
    const ip4Addresses = !vm.has('nics') ? [] : vm.get('nics').reduce((ipSet, nic) => [...ipSet, ...nic.get('ipv4')], [])
    const ip6Addresses = !vm.has('nics') ? [] : vm.get('nics').reduce((ipSet, nic) => [...ipSet, ...nic.get('ipv6')], [])

    // FQDN
    const fqdn = vm.get('fqdn')

    // Cluster
    const canChangeCluster = vmCanChangeCluster(status)
    const clusterId = vm.getIn(['cluster', 'id'])
    const cluster = clusters && clusters.get(clusterId)
    const clusterName = (cluster && cluster.get('name')) || msg.notAvailable()

    // Data Center
    const dataCenterId = (clusters && clusters.getIn([clusterId, 'dataCenterId']))
    const dataCenter = dataCenters && dataCenters.find(v => v.id === dataCenterId)
    const dataCenterName = (dataCenter && dataCenter.name) || msg.notAvailable()

    // Template
    const templateId = vm.getIn(['template', 'id'])
    const templateName = (templates && templates.getIn([templateId, 'name'])) || msg.notAvailable()

    // CD
    const canChangeCd = vm.get('canUserChangeCd') && vmCanChangeCd(status)
    const cdImageId = vm.getIn(['cdrom', 'fileId'])
    const cdImage = isoList.find(iso => iso.file.id === cdImageId)
    const cdImageName = (cdImage && cdImage.file.name) || `[${msg.empty()}]`

    // Cloud-Init
    const cloudInitEnabled = vm.getIn(['cloudInit', 'enabled'])
    const cloudInitHostName = vm.getIn(['cloudInit', 'hostName'])
    const cloudInitSshAuthorizedKeys = vm.getIn(['cloudInit', 'sshAuthorizedKeys'])

    // Boot Menu
    const bootMenuEnabled = vm.get('bootMenuEnabled')

    // Optimized for
    const optimizedFor = rephraseVmType(vm.get('type'))

    // VCPU
    const vCpuCount = vm.getIn(['cpu', 'vCPUs'])

    // Boot devices
    const allowedBootDevices = ['hd', 'network', 'cdrom']
    const FIRST_DEVICE = 0
    const SECOND_DEVICE = 1
    const bootDevices = [
      vm.getIn(['os', 'bootDevices', FIRST_DEVICE], DEFAULT_BOOT_DEVICES.get(FIRST_DEVICE)),
      vm.getIn(['os', 'bootDevices', SECOND_DEVICE], DEFAULT_BOOT_DEVICES.get(SECOND_DEVICE)),
    ]

    // Operation System
    const osType = vm.getIn(['os', 'type'])
    const osId = operatingSystems.find(os => os.get('name') === osType).get('id')

    const { unit: memoryUnit, value: memorySize } = convertValue('B', vm.getIn(['memory', 'total']))

    return <React.Fragment>
      <NextRunChangeConfirmationModal
        show={this.state.promptNextRunChanges}
        onCancel={this.handleNextRunOnCancel}
        onSave={this.handleNextRunOnSave}
        onSaveAndRestart={this.handleNextRunOnSaveAndRestart}
      />
      <HotPlugChangeConfirmationModal
        show={this.state.promptHotPlugChanges}
        onCancel={this.handleHotPlugOnCancel}
        onApplyLater={this.handleHotPlugOnApplyLater}
        onApplyNow={this.handleHotPlugOnApplyNow}
      />
      <BaseCard
        title={msg.cardTitleDetails()}
        editable={canEditDetails || canChangeCd}
        editMode={isEditing}
        idPrefix={idPrefix}
        editTooltip={msg.cardTooltipEditDetails({ vmName: vm.get('name') })}
        onStartEdit={this.handleCardOnStartEdit}
        onCancel={this.handleCardOnCancel}
        onSave={this.handleCardOnSave}
      >
        {({ isEditing }) => {
          const isFullEdit = isEditing && canEditDetails
          return <React.Fragment>
            {/* Regular options */}
            <Grid className={style['details-container']}>
              <Row>
                <Col className={style['fields-column']}>
                  <Grid>
                    <FieldRow label={msg.host()} id={`${idPrefix}-host`}>
                      { hostName || <NotAvailable tooltip={msg.notAvailableUntilRunning()} id={`${idPrefix}-host-not-available`} /> }
                    </FieldRow>
                    <FieldRow label={msg.ipAddress()} id={`${idPrefix}-ip`}>
                      <React.Fragment>
                        { ip4Addresses.length === 0 && ip6Addresses.length === 0 &&
                          <NotAvailable tooltip={msg.notAvailableUntilRunningAndGuestAgent()} id={`${idPrefix}-ip-not-available`} />
                        }
                        { ip4Addresses.length > 0 &&
                          ip4Addresses.map((ip4, index) => <div key={`ip4-${index}`} id={`${idPrefix}-ip-ipv4-${index}`}>{ip4}</div>)
                        }
                        { ip6Addresses.length > 0 &&
                          ip6Addresses.map((ip4, index) => <div key={`ip4-${index}`} id={`${idPrefix}-ip-ipv6-${index}`}>{ip4}</div>)
                        }
                      </React.Fragment>
                    </FieldRow>
                    <FieldRow label={msg.fqdn()} id={`${idPrefix}-fqdn`}>
                      { fqdn || <NotAvailable tooltip={msg.notAvailableUntilRunningAndGuestAgent()} id={`${idPrefix}-fqdn-not-available`} /> }
                    </FieldRow>
                    <FieldRow label={msg.cluster()} id={`${idPrefix}-cluster`}>
                      { !isFullEdit && clusterName }
                      { isFullEdit && !canChangeCluster &&
                        <div>
                          {clusterName}
                          <FieldLevelHelp disabled={false} content={msg.clusterCanOnlyChangeWhenVmStopped()} inline />
                        </div>
                      }
                      { isFullEdit && canChangeCluster &&
                        <SelectBox
                          id={`${idPrefix}-cluster-edit`}
                          items={clusterList.filter(cluster => cluster.datacenter === dataCenterId)}
                          selected={clusterId}
                          onChange={(selectedId) => { this.handleChange('cluster', selectedId) }}
                        />
                      }
                    </FieldRow>
                    <FieldRow label={msg.dataCenter()} id={`${idPrefix}-data-center`}>
                      { !isFullEdit && dataCenterName }
                      { isFullEdit &&
                        <div>
                          {dataCenterName}
                          <FieldLevelHelp disabled={false} content={msg.dataCenterChangesWithCluster()} inline />
                        </div>
                      }
                    </FieldRow>
                  </Grid>
                </Col>
                <Col className={style['fields-column']}>
                  <Grid>
                    <FieldRow label={msg.template()} id={`${idPrefix}-template`}>
                      { !isFullEdit && templateName }
                      { isFullEdit &&
                        <SelectBox
                          id={`${idPrefix}-template-edit`}
                          items={templateList}
                          selected={templateId}
                          onChange={(selectedId) => { this.handleChange('template', selectedId) }}
                        />
                      }
                    </FieldRow>
                    <FieldRow label={isEditing ? msg.changeCd() : msg.cd()} id={`${idPrefix}-cdrom`}>
                      { !isEditing && cdImageName }
                      { isEditing && !canChangeCd &&
                        <div>
                          {cdImageName}
                          <FieldLevelHelp disabled={false} content={msg.cdCanOnlyChangeWhenVmRunning()} inline />
                        </div>
                      }
                      { isEditing && canChangeCd &&
                        <SelectBox
                          id={`${idPrefix}-cd-edit`}
                          items={[
                            { id: '', value: `[${msg.empty()}]` },
                            ...isoList.map(isoFile => ({
                              id: isoFile.file.id,
                              value: isoFile.file.name,
                            })),
                          ]}
                          selected={cdImageId}
                          onChange={(selectedId) => { this.handleChange('cdrom', selectedId) }}
                        />
                      }
                    </FieldRow>
                    <FieldRow label={msg.cloudInit()} id={`${idPrefix}-cloud-init`}>
                      <div className={style['cloud-init-field']}>
                        {cloudInitEnabled ? <Icon type='pf' name='on' /> : <Icon type='pf' name='off' />}
                        {enumMsg('Switch', cloudInitEnabled ? 'on' : 'off')}
                      </div>
                    </FieldRow>
                    <FieldRow label={msg.bootMenu()} id={`${idPrefix}-boot-menu-readonly`}>
                      <div className={style['boot-menu-field']}>
                        {bootMenuEnabled ? <Icon type='pf' name='on' /> : <Icon type='pf' name='off' />}
                        {enumMsg('Switch', bootMenuEnabled ? 'on' : 'off')}
                      </div>
                    </FieldRow>
                    <FieldRow label={msg.console()} id={`${idPrefix}-console`}><ConsoleList idPrefix={`${idPrefix}-console`} vm={vm} /></FieldRow>

                    <FieldRow label={msg.optimizedFor()} id={`${idPrefix}-optimized`}>
                      {optimizedFor}
                    </FieldRow>

                    <FieldRow label={msg.cpus()} id={`${idPrefix}-cpus`}>
                      { !isFullEdit && vCpuCount }
                      { isFullEdit &&
                        <div>
                          <FormControl
                            id={`${idPrefix}-cpus-edit`}
                            className={style['cpu-input']}
                            type='number'
                            value={vCpuCount}
                            onChange={e => this.handleChange('cpu', e.target.value)}
                          />
                        </div>
                      }
                    </FieldRow>
                    <FieldRow label={msg.memory()} id={`${idPrefix}-memory`}>
                      { !isFullEdit && `${round(memorySize)} ${memoryUnit}` }
                      { isFullEdit &&
                        <div>
                          <FormControl
                            id={`${idPrefix}-memory-edit`}
                            className={style['memory-input']}
                            type='number'
                            value={round(memorySize)}
                            onChange={e => this.handleChange('memory', e.target.value)}
                          />
                          {memoryUnit}
                        </div>
                      }
                    </FieldRow>
                  </Grid>
                </Col>
              </Row>
            </Grid>
            {/* Advanced options */}
            { isFullEdit && <ExpandCollapseSection id={`${idPrefix}-advanced-options`} sectionHeader={msg.advancedOptions()}>
              <Grid className={style['details-container']}>
                <Row>
                  {/* First column */}
                  <Col className={style['fields-column']}>
                    <Grid>
                      <FieldRow label={msg.cloudInit()} id={`${idPrefix}-cloud-init`}>
                        <Switch
                          id={`${idPrefix}-cloud-init-edit`}
                          bsSize='mini'
                          handleWidth={30}
                          value={cloudInitEnabled}
                          onChange={(e, state) => { this.handleChange('cloudInitEnabled', state) }}
                        />
                      </FieldRow>
                      { cloudInitEnabled && <div style={{ marginTop: '15px' }}>
                        <FormGroup controlId={`${idPrefix}-cloud-init-hostname`}>
                          <ControlLabel>
                            {msg.hostName()}
                          </ControlLabel>
                          <FormControl
                            type='text'
                            value={cloudInitHostName}
                            onChange={e => this.handleChange('cloudInitHostName', e.target.value)}
                          />
                        </FormGroup>
                        <FormGroup controlId={`${idPrefix}-cloud-init-ssh`}>
                          <ControlLabel>
                            {msg.sshAuthorizedKeys()}
                          </ControlLabel>
                          <FormControl
                            componentClass='textarea'
                            value={cloudInitSshAuthorizedKeys}
                            onChange={e => this.handleChange('cloudInitSshAuthorizedKeys', e.target.value)}
                          />
                        </FormGroup>
                      </div> }
                    </Grid>
                  </Col>
                  {/* Second column */}
                  <Col className={style['fields-column']}>
                    <Grid>
                      <FieldRow label={msg.operatingSystem()} id={`${idPrefix}-os`}>
                        <SelectBox
                          id={`${idPrefix}-os-edit`}
                          items={this.state.osList}
                          selected={osId}
                          onChange={(selectedId) => { this.handleChange('os', selectedId) }}
                        />
                      </FieldRow>
                      <FieldRow label={msg.bootMenu()} id={`${idPrefix}-boot-menu`}>
                        <Switch
                          id={`${idPrefix}-boot-menu-edit`}
                          handleWidth={30}
                          bsSize='mini'
                          value={bootMenuEnabled}
                          onChange={(e, state) => { this.handleChange('bootMenuEnabled', state) }}
                        />
                      </FieldRow>
                      <Row className={style['field-row']}>
                        <Col cols={12} className={style['col-label']}>
                          <div>
                            <span>{msg.bootOrder()}</span>
                            <FieldLevelHelp content={msg.bootSequenceTooltip()} inline />
                          </div>
                        </Col>
                      </Row>
                      <FieldRow label={msg.firstDevice()} id={`${idPrefix}-boot-order-first-device`}>
                        <SelectBox
                          id={`${idPrefix}-boot-order-first-device-edit`}
                          items={allowedBootDevices.map(item => ({
                            id: item,
                            value: msg[`${item}Boot`](),
                          }))}
                          selected={bootDevices[FIRST_DEVICE]}
                          onChange={(selectedId) => { this.handleChange('bootDevices', selectedId, { device: FIRST_DEVICE }) }}
                        />
                      </FieldRow>
                      <FieldRow label={msg.secondDevice()} id={`${idPrefix}-boot-order-second-device`}>
                        <SelectBox
                          id={`${idPrefix}-boot-order-second-device-edit`}
                          items={[
                            { id: null, value: msg.noneItem() },
                            ...allowedBootDevices
                              .filter(item => item !== bootDevices[FIRST_DEVICE])
                              .map(item => ({
                                id: item,
                                value: msg[`${item}Boot`](),
                              })),
                          ]}
                          selected={bootDevices[SECOND_DEVICE]}
                          onChange={(selectedId) => { this.handleChange('bootDevices', selectedId, { device: SECOND_DEVICE }) }}
                        />
                      </FieldRow>
                    </Grid>
                  </Col>
                </Row>
              </Grid>
            </ExpandCollapseSection> }

            { correlatedMessages && correlatedMessages.size > 0 &&
              correlatedMessages.map((message, key) =>
                <Alert key={`user-message-${key}`} type='error' style={{ margin: '5px 0 0 0' }}>{message.get('message')}</Alert>
              )
            }
          </React.Fragment>
        }}
      </BaseCard>
    </React.Fragment>
  }
}
DetailsCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func,

  blankTemplateId: PropTypes.string.isRequired,
  hosts: PropTypes.object.isRequired,
  clusters: PropTypes.object.isRequired,
  dataCenters: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,
  storageDomains: PropTypes.object.isRequired,
  userMessages: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired,

  saveChanges: PropTypes.func.isRequired,
}

const DetailsCardConnected = connect(
  (state) => ({
    blankTemplateId: state.config.get('blankTemplateId'),
    hosts: state.hosts,
    clusters: state.clusters,
    dataCenters: state.dataCenters,
    templates: state.templates,
    storageDomains: state.storageDomains,
    userMessages: state.userMessages,
    operatingSystems: state.operatingSystems,
  }),
  (dispatch) => ({
    saveChanges: (minimalVmChanges, restartAfterEdit, nextRun, correlationId) =>
      dispatch(Actions.editVm(
        { vm: minimalVmChanges, restartAfterEdit, nextRun },
        { correlationId }
      )),
  })
)(DetailsCard)

export default DetailsCardConnected
