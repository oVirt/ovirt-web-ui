import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { List } from 'immutable'

import * as Actions from '_/actions'
import { MAX_VM_MEMORY_FACTOR, MAX_VM_VCPU_EDIT } from '_/constants'
import {
  filterOsByArchitecture,
  generateUnique,
  getClusterArchitecture,
  getDefaultOSByArchitecture,
  isWindows,
  templateNameRenderer,
  userFormatOfBytes,
  buildMessageFromRecord,
} from '_/helpers'
import { enumMsg, MsgContext, withMsg } from '_/intl'
import { isNumber, isNumberInRange } from '_/utils'

import {
  canChangeCluster as vmCanChangeCluster,
  canChangeCd as vmCanChangeCd,
} from '_/vm-status'

import {
  createClusterList,
  createIsoList,
  createOsList,
  getTopology,
  getTopologyPossibleValues,
  isValidOsIcon,
} from '_/components/utils'

import {
  Alert,
  ExpandCollapse,
  FormControl,
  Icon,
} from 'patternfly-react'

import { Switch } from '@patternfly/react-core'

import SelectBox from '_/components/SelectBox'
import BaseCard from '../../BaseCard'

import { Grid, Row, Col } from '_/components/Grid'
import EllipsisValue from '_/components/EllipsisValue'

import style from './style.css'

import CloudInit from './CloudInit'
import HotPlugChangeConfirmationModal from './HotPlugConfirmationModal'
import NextRunChangeConfirmationModal from './NextRunChangeConfirmationModal'
import FieldRow from './FieldRow'
import { Tooltip, InfoTooltip } from '_/components/tooltips'

import timezones from '_/components/utils/timezones.json'

function rephraseVmType (vmType, msg) {
  const types = {
    'desktop': msg.vmType_desktop(),
    'server': msg.vmType_server(),
    'high_performance': msg.vmType_highPerformance(),
  }

  const type = vmType.toLowerCase()
  if (type in types) {
    return types[type]
  }

  return vmType
}

/*
 * Render "N/A" with an optional tooltip for any field that won't have a value
 * based on the state of the VM.
 */
const NotAvailable = ({ tooltip, id }) => {
  const { msg } = useContext(MsgContext)
  return (
    <div>
      { tooltip
        ? (
          <Tooltip id={id} tooltip={tooltip}>
            <span>{msg.notAvailable()}</span>
          </Tooltip>
        )
        : (
          <span id={id}>{msg.notAvailable()}</span>
        )
      }
    </div>
  )
}
NotAvailable.propTypes = {
  tooltip: PropTypes.string,
  id: PropTypes.string.isRequired,
}

const DEFAULT_BOOT_DEVICES = List(['hd', null])
const DEFAULT_GMT_TIMEZONE = timezones.find(timezone => timezone.value.startsWith('(GMT) Greenwich')).id

/*
 * Specific information and details of the VM (status/up-time, data center, cluster,
 * host, template, IP addresses, FQDN, CD, consoles, memory, CPUs, cloud-init, boot menu,
 * boot order)
 */
class DetailsCard extends React.Component {
  constructor (props) {
    super(props)
    const { vm, clusters, operatingSystems, locale } = props
    const vmClusterId = vm.getIn(['cluster', 'id'])
    const vmDataCenterId = clusters.getIn([vmClusterId, 'dataCenterId'])
    const clusterArchitecture = getClusterArchitecture(vmClusterId, clusters)

    this.state = {
      vm, // ImmutableJS Map

      isEditing: false,
      isDirty: false,
      correlationId: null,
      correlatedMessages: null,

      promptHotPlugChanges: false,
      promptNextRunChanges: false,
      isoList: createIsoList(props.storageDomains, vmDataCenterId),
      clusterList: createClusterList({ clusters, dataCenterId: vmDataCenterId, architecture: clusterArchitecture, locale }),
      osList: createOsList({ clusterId: vmClusterId, clusters, operatingSystems, locale }),

      enableInitTimezone: !!vm.getIn(['cloudInit', 'timezone']), // true if sysprep timezone set or Configure Timezone checkbox checked
      lastInitTimezone: vm.getIn(['cloudInit', 'timezone']) || DEFAULT_GMT_TIMEZONE,
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

    this.grabCpuOptions = this.grabCpuOptions.bind(this)
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
    //       __storageDomains__, and __operatingSystems__ don't need to be kept in state for
    //       change comparison
    const { clusters, vm, operatingSystems, locale } = this.props
    const vmClusterId = vm.getIn(['cluster', 'id'])
    const vmDataCenterId = clusters.getIn([vmClusterId, 'dataCenterId'])
    const clusterArchitecture = getClusterArchitecture(vmClusterId, clusters)

    if (prevProps.clusters !== this.props.clusters) {
      const { clusters } = this.props
      this.setState({ clusterList: createClusterList({ clusters, dataCenterId: vmDataCenterId, architecture: clusterArchitecture, locale }) }) // eslint-disable-line react/no-did-update-set-state
    }

    if (prevProps.storageDomains !== this.props.storageDomains) {
      this.setState({ isoList: createIsoList(this.props.storageDomains, vmDataCenterId) }) // eslint-disable-line react/no-did-update-set-state
    }

    if (prevProps.operatingSystems !== this.props.operatingSystems ||
      prevProps.clusters !== this.props.clusters ||
      prevProps.vm.getIn(['cluster', 'id']) !== vmClusterId
    ) {
      this.setState({ osList: createOsList({ clusterId: vmClusterId, clusters, operatingSystems, locale }) }) // eslint-disable-line react/no-did-update-set-state
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

  grabCpuOptions () {
    const { vm } = this.state
    const cluster = this.props.clusters.get(vm.getIn(['cluster', 'id']))

    const cpuOptions = vm.get('cpuOptions') || cluster.get('cpuOptions')
    return {
      maxNumOfSockets: cpuOptions.get('maxNumOfSockets'),
      maxNumOfCores: cpuOptions.get('maxNumOfCores'),
      maxNumOfThreads: cpuOptions.get('maxNumOfThreads'),
      maxNumOfVmCpus: cpuOptions.get('maxNumOfVmCpus'),
    }
  }

  handleChange (fieldName, value, additionalArgs) {
    if (this.state.isEditing && !this.state.isDirty) {
      this.props.onEditChange(true, true)
    }

    let updates = this.state.vm

    const { enableInitTimezone, lastInitTimezone } = this.state
    let initTimezoneUpdates = { enableInitTimezone, lastInitTimezone }

    const changeQueue = [{ fieldName, value }]
    const {
      operatingSystems,
      clusters,
      templates,
    } = this.props

    for (let change = changeQueue.shift(); change; change = changeQueue.shift()) {
      console.log('processing change', change)
      const { fieldName, value } = change
      const {
        maxNumOfSockets,
        maxNumOfCores,
        maxNumOfThreads,
        maxNumOfVmCpus,
      } = this.grabCpuOptions()

      let fieldUpdated
      switch (fieldName) {
        case 'cluster':
          updates = updates.set('cluster', clusters.get(value))
          fieldUpdated = 'cluster'
          break

        case 'template':
          updates = updates.set('template', templates.get(value))
          fieldUpdated = 'template'

          // Apply settings from the template to the VM (memory, CPUs, OS, cloudInit, bootMenuEnabled)
          {
            const template = templates.get(value)
            if (template) {
              const clusterId = updates.getIn(['cluster', 'id'])
              const clusterArchitecture = getClusterArchitecture(clusterId, clusters)
              const templateOsName = template.getIn(['os', 'type'], 'other')
              const templateOs = filterOsByArchitecture(operatingSystems, clusterArchitecture)
                .find(os => os.get('name') === templateOsName) ||
                getDefaultOSByArchitecture(operatingSystems, clusterArchitecture)

              // fields that are editable on the card
              changeQueue.push(
                { fieldName: 'memory', value: template.get('memory') / (1024 ** 2) }, // input assumed to be MiB
                { fieldName: 'cpu', value: template.getIn(['cpu', 'vCPUs']) },
                { fieldName: 'bootMenuEnabled', value: template.get('bootMenuEnabled') },
                { fieldName: 'os', value: templateOs && templateOs.get('id') },
                { fieldName: 'cloudInitEnabled', value: template.getIn(['cloudInit', 'enabled']) },
                { fieldName: 'cloudInitHostName', value: template.getIn(['cloudInit', 'hostName']) },
                { fieldName: 'cloudInitSshAuthorizedKeys', value: template.getIn(['cloudInit', 'sshAuthorizedKeys']) },
                { fieldName: 'cloudInitTimezone', value: template.getIn(['cloudInit', 'timezone']) },
                { fieldName: 'cloudInitCustomScript', value: template.getIn(['cloudInit', 'customScript']) },
                { fieldName: 'cloudInitPassword', value: template.getIn(['cloudInit', 'password']) },
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
          // when sysprep enabled and Configure Timezone checkbox checked, set the sysprep timezone to the last selected one
          updates = updates.setIn(['cloudInit', 'timezone'], value && enableInitTimezone ? lastInitTimezone : '')
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

        case 'cloudInitTimezone':
          updates = updates.setIn(['cloudInit', 'timezone'], value)
          initTimezoneUpdates.lastInitTimezone = value // remember the actual change of the sysprep timezone
          fieldUpdated = 'cloudInit'
          break

        case 'cloudInitCustomScript':
          updates = updates.setIn(['cloudInit', 'customScript'], value)
          fieldUpdated = 'cloudInit'
          break

        case 'cloudInitPassword':
          updates = updates.setIn(['cloudInit', 'password'], value)
          fieldUpdated = 'cloudInit'
          break

        case 'enableInitTimezone': // Configure Timezone checkbox change
          updates = updates.setIn(['cloudInit', 'timezone'], value ? lastInitTimezone : '')
          initTimezoneUpdates.enableInitTimezone = value
          fieldUpdated = 'cloudInit'
          break

        case 'os':
          fieldUpdated = 'os'
          const os = operatingSystems.find(os => os.get('id') === value)
          updates = this.updateOs(updates, os)

          const timeZoneName = updates.getIn(['timeZone', 'name'])
          const isWindowsTimeZone = timezones.find(timezone => timezone.id === timeZoneName)
          const isWindowsVm = isWindows(os.get('name'))

          if (isWindowsVm && !isWindowsTimeZone) {
            changeQueue.push({ fieldName: 'timeZone', value: this.props.defaultWindowsTimezone })
          }
          if (!isWindowsVm && isWindowsTimeZone) {
            changeQueue.push({ fieldName: 'timeZone', value: this.props.defaultGeneralTimezone })
          }
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
          // Allow a value that is too large in case the max total changes due to a Cluster change
          if (isNumber(value) && value > 0 && value <= MAX_VM_VCPU_EDIT) {
            let topology = { sockets: value, cores: 1, threads: 1 }
            if (value > maxNumOfSockets && value <= maxNumOfVmCpus) {
              topology = getTopology({
                value,
                max: {
                  sockets: maxNumOfSockets,
                  cores: maxNumOfCores,
                  threads: maxNumOfThreads,
                },
              })
            }
            updates = updates.mergeDeep({
              'cpu': {
                topology,
                'vCPUs': +value, // === sockets * cores * threads
              },
            })
            fieldUpdated = 'cpu'
            this.hotPlugUpdates['cpu'] = true
          }
          break

        case 'topology':
          let topology = getTopology({
            value: this.state.vm.getIn(['cpu', 'vCPUs']),
            max: {
              sockets: maxNumOfSockets,
              cores: maxNumOfCores,
              threads: maxNumOfThreads,
            },
            force: {
              [additionalArgs.vcpu]: parseInt(value),
            },
          })
          updates = updates.mergeDeep({
            'cpu': {
              topology,
            },
          })
          fieldUpdated = 'topology'
          this.hotPlugUpdates['topology'] = true
          break

        case 'memory':
          if (isNumber(value) && value > 0) {
            const asBytes = value * (1024 ** 2) // input assumed to be MiB
            updates = updates.setIn(['memory', 'total'], asBytes)
            fieldUpdated = 'memory'
            this.hotPlugUpdates['memory'] = true
          }
          break

        case 'timeZone':
          updates = updates.mergeDeep({
            timeZone: {
              name: value,
            },
          })
          fieldUpdated = 'timeZone'
          break
      }

      if (updates !== this.state.vm) {
        this.trackUpdates[fieldUpdated] = true
        this.setState({ vm: updates, isDirty: true, ...initTimezoneUpdates })
      }
    } // for
  }

  handleCardOnCancel () {
    const cloudInitTimezone = this.props.vm.getIn(['cloudInit', 'timezone'])
    this.setState({
      isEditing: false,
      isDirty: false,
      correlationId: null,
      correlatedMessages: null,
      lastInitTimezone: cloudInitTimezone || DEFAULT_GMT_TIMEZONE,
      enableInitTimezone: !!cloudInitTimezone,
    })
    this.props.onEditChange(false)
  }

  handleCardOnSave () {
    const isVmRunning = this.props.vm.get('status') === 'up'

    if (Object.keys(this.trackUpdates).length === 0) {
      this.handleCardOnCancel()
      return
    }

    // Note: The validations may already be done elsewhere, and the save button should
    //       only be active if the card fields are valid, but repeat them here to be
    //       sure.
    // Run field validations. If any input field is not valid, don't allow the save.
    const { maxNumOfVmCpus } = this.grabCpuOptions()
    const vCpuCount = this.state.vm.getIn(['cpu', 'vCPUs'])
    const vCpuCountIsValid = isNumberInRange(vCpuCount, 0, maxNumOfVmCpus)

    if (!vCpuCountIsValid) {
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
      this.setState({
        enableInitTimezone: vmUpdates['cloudInit'].enabled,
        lastInitTimezone: vmUpdates['cloudInit'].timezone || DEFAULT_GMT_TIMEZONE,
      })
    }

    if (this.trackUpdates['timeZone']) {
      vmUpdates['timeZone'] = stateVm.get('timeZone').toJS()
    }

    if (this.trackUpdates['bootDevices']) {
      vmUpdates['os'] = {
        bootDevices: stateVm.getIn(['os', 'bootDevices']).toJS(),
      }
    }

    if (this.trackUpdates['cpu'] || this.trackUpdates['topology']) {
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
    const { hosts, clusters, dataCenters, templates, operatingSystems, vms, isAdmin, msg } = this.props
    const { vm, isEditing, correlatedMessages, clusterList, isoList } = this.state

    const idPrefix = 'vmdetail-details'

    const showIPs = vm.get('status') === 'up'
    const isPoolVm = vm.getIn(['pool', 'id']) !== undefined
    const canEditDetails = vm.get('canUserEditVm') && !isPoolVm
    let pool = null
    if (isPoolVm) {
      pool = vms.getIn(['pools', vm.getIn(['pool', 'id'])])
    }
    const isPoolAutomatic = pool && pool.get('type') === 'automatic'
    const status = vm.get('status')

    // Host Name
    const hostName = hosts && hosts.getIn([vm.get('hostId'), 'name'])

    // IP Addresses
    const ip4Addresses = [...(new Set(!vm.has('nics') || !showIPs
      ? []
      : vm.get('nics').reduce((ipSet, nic) => [...ipSet, ...nic.get('ipv4')], [])))]
    const ip6Addresses = [...(new Set(
      !vm.has('nics') || !showIPs
        ? []
        : vm.get('nics').reduce((ipSet, nic) => [...ipSet, ...nic.get('ipv6')], [])))]

    // FQDN
    const fqdn = vm.get('fqdn')

    // Cluster
    const canChangeCluster = vmCanChangeCluster(status)
    const clusterId = vm.getIn(['cluster', 'id'])
    const cluster = clusters && clusters.get(clusterId)
    const isClusterPower8 = cluster && cluster.get('architecture') === 'ppc64'
    const clusterName = (cluster && cluster.get('name')) || msg.notAvailable()

    // Data Center
    const dataCenterId = (clusters && clusters.getIn([clusterId, 'dataCenterId']))
    const dataCenter = dataCenters && dataCenters.find(v => v.id === dataCenterId)
    const dataCenterName = (dataCenter && dataCenter.name) || msg.notAvailable()

    // Template
    const templateId = vm.getIn(['template', 'id'])
    const templateName = (templates && templateNameRenderer(templates.get(templateId))) || msg.notAvailable()

    // CD
    const canChangeCd = vm.get('canUserChangeCd') && vmCanChangeCd(status)
    const cdImageId = vm.getIn(['cdrom', 'fileId'])
    const cdImage = isoList.find(iso => iso.file.id === cdImageId)
    const cdImageName = (cdImage && cdImage.file.name) || `[${msg.empty()}]`

    // Cloud-Init
    const cloudInitEnabled = vm.getIn(['cloudInit', 'enabled'])
    const isOsWindows = isWindows(vm.getIn(['os', 'type']))

    // Boot Menu
    const bootMenuEnabled = vm.get('bootMenuEnabled')

    // Optimized for
    const optimizedFor = rephraseVmType(vm.get('type'), msg)

    // vCPU
    const SOCKETS_VCPU = 'sockets'
    const CORES_VCPU = 'cores'
    const THREADS_VCPU = 'threads'
    const { maxNumOfSockets, maxNumOfCores, maxNumOfThreads, maxNumOfVmCpus } = this.grabCpuOptions()

    const vCpuCount = vm.getIn(['cpu', 'vCPUs'])
    const vCpuCountIsValid = isNumberInRange(vCpuCount, 0, maxNumOfVmCpus)

    const vCpuTopology = vm.getIn(['cpu', 'topology'])
    const vCpuTopologyDividers = vCpuCountIsValid
      ? getTopologyPossibleValues({
        value: vCpuCount,
        maxNumOfSockets,
        maxNumOfCores,
        maxNumOfThreads,
      })
      : { sockets: [1], cores: [1], threads: [1] }

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
    const osId = operatingSystems &&
      operatingSystems.find(os => os.get('name') === osType) &&
      operatingSystems.find(os => os.get('name') === osType).get('id')

    // Memory
    const memorySize = vm.getIn(['memory', 'total'])

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
        disableTooltip={isPoolVm && isPoolAutomatic ? msg.automaticPoolsNotEditable({ poolName: pool.get('name') }) : undefined}
        editMode={isEditing}
        editTooltip={msg.edit()}
        editTooltipPlacement={'bottom'}
        idPrefix={idPrefix}
        disableSaveButton={!vCpuCountIsValid}
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
                    {
                      isAdmin &&
                      <FieldRow label={msg.host()} id={`${idPrefix}-host`}>
                        {<EllipsisValue tooltip={hostName}>{hostName}</EllipsisValue> || <NotAvailable tooltip={msg.notAvailableUntilRunning()} id={`${idPrefix}-host-not-available`} />}
                      </FieldRow>
                    }
                    <FieldRow label={msg.ipAddress()} id={`${idPrefix}-ip`} >
                      <React.Fragment>
                        { ip4Addresses.length === 0 && ip6Addresses.length === 0 &&
                          <NotAvailable tooltip={msg.notAvailableUntilRunningAndGuestAgent()} id={`${idPrefix}-ip-not-available`} />
                        }
                        { ip4Addresses.length > 0 &&
                          ip4Addresses.map((ip4, index) =>
                            <EllipsisValue tooltip={ip4} key={`ip4-${index}`} id={`${idPrefix}-ip-ipv4-${index}`}>
                              {ip4}
                            </EllipsisValue>
                          )
                        }
                        { ip6Addresses.length > 0 &&
                          ip6Addresses.map((ip4, index) =>
                            <EllipsisValue tooltip={ip4} key={`ip4-${index}`} id={`${idPrefix}-ip-ipv6-${index}`}>
                              {ip4}
                            </EllipsisValue>
                          )
                        }
                      </React.Fragment>
                    </FieldRow>
                    <FieldRow label={msg.fqdn()} id={`${idPrefix}-fqdn`}>
                      { <EllipsisValue tooltip={fqdn}>{fqdn}</EllipsisValue> || <NotAvailable tooltip={msg.notAvailableUntilRunningAndGuestAgent()} id={`${idPrefix}-fqdn-not-available`} /> }
                    </FieldRow>
                    <FieldRow label={msg.cluster()} id={`${idPrefix}-cluster`} tooltip={isFullEdit && !canChangeCluster && msg.clusterCanOnlyChangeWhenVmStopped()} >
                      { !isFullEdit && clusterName }
                      { isFullEdit && !canChangeCluster &&
                        <div>
                          {clusterName}
                        </div>
                      }
                      { isFullEdit && canChangeCluster &&
                        <SelectBox
                          id={`${idPrefix}-cluster-edit`}
                          items={clusterList}
                          selected={clusterId}
                          onChange={(selectedId) => { this.handleChange('cluster', selectedId) }}
                        />
                      }
                    </FieldRow>
                    <FieldRow label={msg.dataCenter()} tooltip={isFullEdit && msg.dataCenterChangesWithCluster()} id={`${idPrefix}-data-center`}>
                      {dataCenterName}
                    </FieldRow>
                  </Grid>
                </Col>
                <Col className={style['fields-column']}>
                  <Grid>
                    <FieldRow label={msg.template()} id={`${idPrefix}-template`}>
                      { templateName }
                    </FieldRow>
                    <FieldRow label={msg.cd()} id={`${idPrefix}-cdrom`} tooltip={isEditing && !canChangeCd && msg.cdCanOnlyChangeWhenVmRunning()} >
                      { !isEditing && <EllipsisValue tooltip={cdImageName}>{cdImageName}</EllipsisValue> }
                      { isEditing && !canChangeCd &&
                        <div>
                          <EllipsisValue tooltip={cdImageName}>{cdImageName}</EllipsisValue>
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
                    <FieldRow label={isOsWindows ? msg.sysprep() : msg.cloudInit()} id={`${idPrefix}-cloud-init`}>
                      <div className={style['cloud-init-field']}>
                        {cloudInitEnabled ? <Icon type='pf' name='on' /> : <Icon type='pf' name='off' />}
                        {enumMsg('Switch', cloudInitEnabled ? 'on' : 'off', msg)}
                      </div>
                    </FieldRow>
                    <FieldRow label={msg.bootMenu()} id={`${idPrefix}-boot-menu-readonly`}>
                      <div className={style['boot-menu-field']}>
                        {bootMenuEnabled ? <Icon type='pf' name='on' /> : <Icon type='pf' name='off' />}
                        {enumMsg('Switch', bootMenuEnabled ? 'on' : 'off', msg)}
                      </div>
                    </FieldRow>

                    <FieldRow label={msg.optimizedFor()} id={`${idPrefix}-optimized`}>
                      {optimizedFor}
                    </FieldRow>

                    <FieldRow
                      label={msg.cpus()}
                      id={`${idPrefix}-cpus`}
                      tooltip={
                        <div>
                          <span>The total virtual CPUs include:</span>
                          <ul className={style['cpu-tooltip-list']} >
                            <li>{msg.totalSocketsCpuTooltipMessage({ number: vCpuTopology.get('sockets') })}</li>
                            <li>{msg.totalCoresCpuTooltipMessage({ number: vCpuTopology.get('cores') })}</li>
                            <li>{msg.totalThreadsCpuTooltipMessage({ number: vCpuTopology.get('threads') })}</li>
                          </ul>
                        </div>
                      }
                      validationState={vCpuCountIsValid ? null : 'error'}
                    >
                      { !isFullEdit && vCpuCount }
                      { isFullEdit &&
                        <div>
                          <FormControl
                            id={`${idPrefix}-cpus-edit`}
                            className={style['cpu-input']}
                            type='number'
                            min={1}
                            max={MAX_VM_VCPU_EDIT}
                            value={vCpuCount}
                            onChange={e => this.handleChange('cpu', e.target.value)}
                          />
                          { !vCpuCountIsValid &&
                            <div className={style['cpu-input-error']}>
                              {msg.maxAllowedCpus({ max: maxNumOfVmCpus })}
                            </div>
                          }
                        </div>
                      }
                    </FieldRow>
                    <FieldRow label={msg.memory()} id={`${idPrefix}-memory`}>
                      { !isFullEdit && `${userFormatOfBytes(memorySize).str}` }
                      { isFullEdit &&
                        <div>
                          <FormControl
                            id={`${idPrefix}-memory-edit`}
                            className={style['memory-input']}
                            type='number'
                            value={(memorySize / (1024 ** 2))}
                            onChange={e => this.handleChange('memory', e.target.value)}
                          />
                          MiB
                        </div>
                      }
                    </FieldRow>
                  </Grid>
                </Col>
              </Row>
            </Grid>

            {/* Advanced options */}
            { isFullEdit && <ExpandCollapse id={`${idPrefix}-advanced-options`} textCollapsed={msg.advancedOptions()} textExpanded={msg.advancedOptions()}>
              <Grid className={style['details-container']}>
                <Row>
                  {/* First column */}
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
                          isChecked={bootMenuEnabled}
                          onChange={state => this.handleChange('bootMenuEnabled', state)}
                        />
                      </FieldRow>
                      <CloudInit idPrefix={idPrefix} vm={vm} onChange={this.handleChange} isWindows={isOsWindows} lastInitTimezone={this.state.lastInitTimezone} />
                    </Grid>
                  </Col>
                  {/* Second column */}
                  <Col className={style['fields-column']}>
                    <Grid>
                      {/* Boot sequence */}
                      <Row className={style['field-row']}>
                        <Col cols={12} className={style['col-label']}>
                          <div>
                            <span>{msg.bootOrder()}</span>
                            <InfoTooltip id={`${idPrefix}-edit-boot-order-tooltip`} tooltip={msg.selectTheBootableDeviceTooltip()} />
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
                      {/* vCPU Topology */}
                      <Row className={style['field-row-divide']}>
                        <Col cols={12} className={style['col-label']}>
                          <div>
                            <span>{msg.vcpuTopology()}</span>
                          </div>
                        </Col>
                      </Row>
                      <FieldRow label={msg.virtualSockets()} id={`${idPrefix}-vcpu-topology-sockets`}>
                        <SelectBox
                          id={`${idPrefix}-vcpu-topology-sockets-edit`}
                          items={vCpuTopologyDividers.sockets.map(i => ({
                            id: i.toString(),
                            value: i.toString(),
                          }))}
                          disabled={!vCpuCountIsValid}
                          selected={vCpuTopology.get('sockets').toString()}
                          onChange={(selectedId) => { this.handleChange('topology', selectedId, { vcpu: SOCKETS_VCPU }) }}
                        />
                      </FieldRow>
                      <FieldRow label={msg.coresPerSockets()} id={`${idPrefix}-vcpu-topology-cores`}>
                        <SelectBox
                          id={`${idPrefix}-vcpu-topology-cores-edit`}
                          items={vCpuTopologyDividers.cores.map(i => ({
                            id: i.toString(),
                            value: i.toString(),
                          }))}
                          disabled={!vCpuCountIsValid}
                          selected={vCpuTopology.get('cores').toString()}
                          onChange={(selectedId) => { this.handleChange('topology', selectedId, { vcpu: CORES_VCPU }) }}
                        />
                      </FieldRow>
                      <FieldRow
                        label={msg.threadsPerCores()}
                        id={`${idPrefix}-vcpu-topology-threads`}
                        tooltip={
                          isClusterPower8
                            ? msg.recomendedPower8ValuesForThreads({ threads: maxNumOfThreads })
                            : msg.recomendedValuesForThreads()
                        }>
                        <SelectBox
                          id={`${idPrefix}-vcpu-topology-threads-edit`}
                          items={vCpuTopologyDividers.threads.map(i => ({
                            id: i.toString(),
                            value: i.toString(),
                          }))}
                          disabled={!vCpuCountIsValid}
                          selected={vCpuTopology.get('threads').toString()}
                          onChange={(selectedId) => { this.handleChange('topology', selectedId, { vcpu: THREADS_VCPU }) }}
                        />
                      </FieldRow>
                    </Grid>
                  </Col>
                </Row>
              </Grid>
            </ExpandCollapse> }

            { correlatedMessages && correlatedMessages.size > 0 &&
              correlatedMessages.map((message, key) =>
                <Alert key={`user-message-${key}`} type='error' style={{ margin: '5px 0 0 0' }}>{buildMessageFromRecord(message.toJS(), msg)}</Alert>
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
  vms: PropTypes.object.isRequired,
  onEditChange: PropTypes.func,

  hosts: PropTypes.object.isRequired,
  clusters: PropTypes.object.isRequired,
  dataCenters: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,
  storageDomains: PropTypes.object.isRequired,
  userMessages: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  defaultGeneralTimezone: PropTypes.string.isRequired,
  defaultWindowsTimezone: PropTypes.string.isRequired,

  saveChanges: PropTypes.func.isRequired,

  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

const DetailsCardConnected = connect(
  (state) => ({
    vms: state.vms,
    hosts: state.hosts,
    clusters: state.clusters,
    dataCenters: state.dataCenters,
    templates: state.templates,
    storageDomains: state.storageDomains,
    userMessages: state.userMessages,
    operatingSystems: state.operatingSystems,
    isAdmin: state.config.get('administrator'),
    defaultGeneralTimezone: state.config.get('defaultGeneralTimezone'),
    defaultWindowsTimezone: state.config.get('defaultWindowsTimezone'),
  }),
  (dispatch) => ({
    saveChanges: (minimalVmChanges, restartAfterEdit, nextRun, correlationId) =>
      dispatch(Actions.editVm(
        { vm: minimalVmChanges, restartAfterEdit, nextRun },
        { correlationId }
      )),
  })
)(withMsg(DetailsCard))

export default DetailsCardConnected
