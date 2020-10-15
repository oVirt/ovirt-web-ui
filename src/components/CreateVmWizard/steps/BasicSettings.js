import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { localeCompare, isWindows } from '_/helpers'
import { msg } from '_/intl'
import { isNumberInRange } from '_/utils'
import { BASIC_DATA_SHAPE } from '../dataPropTypes'

import {
  createClusterList,
  createIsoList,
  createOsList,
  createTemplateList,
  getTopology,
  getTopologyPossibleValues,
  isHostNameValid,
  isVmNameValid,
} from '_/components/utils'

import {
  ExpandCollapse,
  FieldLevelHelp,
  Form,
  FormControl,
  Checkbox,
} from 'patternfly-react'
import { Grid, Row, Col } from '_/components/Grid'
import SelectBox from '_/components/SelectBox'

import timezones from '_/components/utils/timezones.json'

import style from './style.css'

/*
 * Render a label plus children as a single grid row with 2 columns.
 */
const FieldRow = ({
  id,
  label = ' ',
  required = false,
  rowClassName = '',
  vertical = false,
  validationState = null,
  labelCols = 3,
  fieldCols = 7,
  children,
  tooltip,
}) => (
  <Row className={`
      form-group
      ${style['field-row']}
      ${required ? 'required' : ''}
      ${rowClassName}
      ${validationState ? `has-${validationState}` : ''}
    `}
  >
    { vertical &&
      <React.Fragment>
        <Col offset={labelCols} cols={fieldCols} className={style['col-data']} id={id}>
          <div className={style['col-label-vertical']}>
            {label}
          </div>
          <div>{children}</div>
        </Col>
      </React.Fragment>
    }
    { !vertical &&
      <React.Fragment>
        <Col cols={labelCols} className={`control-label ${style['col-label']}`}>
          {label}
          { tooltip &&
            <FieldLevelHelp
              content={tooltip}
              inline
            />
          }
        </Col>
        <Col cols={fieldCols} className={style['col-data']} id={id}>{children}</Col>
      </React.Fragment>
    }
  </Row>
)
FieldRow.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  rowClassName: PropTypes.string,
  vertical: PropTypes.bool,
  validationState: PropTypes.oneOf(['success', 'warning', 'error', null]),
  labelCols: PropTypes.number,
  fieldCols: PropTypes.number,
  children: PropTypes.node.isRequired,
  tooltip: PropTypes.string,
}

const SubHeading = ({ children }) => (
  <Row className='form-group'>
    <Col offset={3} cols={7} className={style['sub-heading']}>
      {children}
    </Col>
  </Row>
)
SubHeading.propTypes = {
  children: PropTypes.node.isRequired,
}

function isValidSource (toTest) {
  return [ 'iso', 'template' ].includes(toTest)
}

function isValidUid (toTest) {
  return toTest && toTest !== '_'
}

function isOsLinux (operatingSystemId, operatingSystems) {
  const os = operatingSystems.get(operatingSystemId)
  return os && !os.get('isWindows')
}

function isOsWindows (operatingSystemId, operatingSystems) {
  const os = operatingSystems.get(operatingSystemId)
  return os && os.get('isWindows')
}

export const optimizedForMap = {
  'desktop': { id: 'desktop', value: msg.vmType_desktop() },
  'server': { id: 'server', value: msg.vmType_server() },
  // 'high_performance': { id: 'high_performance', value: msg.vmType_highPerformance() },
}

/**
 * Basic Setting Wizard Step #1
 *
 */
class BasicSettings extends React.Component {
  constructor (props) {
    super(props)
    this.checkTimeZone = this.checkTimeZone.bind(this)
    this.getTopologySettings = this.getTopologySettings.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.validateForm = this.validateForm.bind(this)
    this.validateVmName = this.validateVmName.bind(this)
    this.mapVCpuTopologyItems = this.mapVCpuTopologyItems.bind(this)
    this.handleProvisionSourceChange = this.handleProvisionSourceChange.bind(this)

    this.fields = {
      select: [
        'clusterId', 'provisionSource', 'templateId', 'isoImage', 'optimizedFor',
      ],
      checkBoxes: [
        'startOnCreation', 'cloudInitEnabled',
      ],
    }
  }

  checkTimeZone (osId, templateId) {
    const { defaultGeneralTimezone, defaultWindowsTimezone } = this.props
    const template = templateId ? this.props.templates.get(templateId) : undefined

    let timeZone = {
      name: defaultGeneralTimezone,
    }
    const osType = this.props.operatingSystems.getIn([ osId, 'name' ])

    if (template && template.getIn(['timeZone', 'name'])) {
      timeZone = template.get('timeZone').toJS()
    }

    const isWindowsTimeZone = timeZone && timezones.find(timezone => timezone.id === timeZone.name)
    const isWindowsVm = isWindows(osType)

    if (isWindowsVm && !isWindowsTimeZone) {
      timeZone = {
        name: defaultWindowsTimezone,
      }
    }
    if (!isWindowsVm && isWindowsTimeZone) {
      timeZone = {
        name: defaultGeneralTimezone,
      }
    }
    return timeZone
  }

  validateForm (dataSet) {
    const {
      dataCenters, clusters, storageDomains, templates, operatingSystems,
      maxMemorySizeInMiB, maxNumOfVmCpus,
    } = this.props

    const okName = dataSet.name && isVmNameValid(dataSet.name)

    const okDataCenter = isValidUid(dataSet.dataCenterId) && dataCenters.find(dc => dc.id === dataSet.dataCenterId) !== undefined
    const okCluster = isValidUid(dataSet.clusterId) &&
      clusters.get(dataSet.clusterId) !== undefined &&
      clusters.getIn([ dataSet.clusterId, 'dataCenterId' ]) === dataSet.dataCenterId

    const okProvision = isValidSource(dataSet.provisionSource)
    const okProvisionIso = dataSet.provisionSource === 'iso' &&
      storageDomains.find(sd =>
        sd.getIn([ 'statusPerDataCenter', dataSet.dataCenterId ]) === 'active' &&
        sd.get('files', []).find(f => f.id === dataSet.isoImage)
      ) !== undefined

    const okProvisionTemplate = dataSet.provisionSource === 'template' &&
        [ null, dataSet.clusterId ].includes(templates.getIn([ dataSet.templateId, 'clusterId' ]))

    const okOperatingSystem = dataSet.operatingSystemId && operatingSystems.find(os => os.get('id') === dataSet.operatingSystemId) !== undefined
    const okMemory = isNumberInRange(dataSet.memory, 0, maxMemorySizeInMiB)
    const okCpu = isNumberInRange(dataSet.cpus, 0, maxNumOfVmCpus)
    const okOptimizedFor = dataSet.optimizedFor && optimizedForMap[dataSet.optimizedFor] !== undefined

    const checkInit = dataSet.cloudInitEnabled
    const okInitHostname = dataSet.initHostname ? isHostNameValid(dataSet.initHostname) : true

    return okName &&
      okDataCenter && okCluster &&
      okProvision && (okProvisionIso || okProvisionTemplate) &&
      okOperatingSystem && okMemory && okCpu && okOptimizedFor &&
      (checkInit ? okInitHostname : true)
  }

  validateVmName () {
    const name = this.props.data.name
    return name === undefined || name.length === 0 || isVmNameValid(name) ? null : 'error'
  }

  // Calculate the proper number of virtual sockets, cores per virtual socket, threads per core according to the number of virtual CPUs
  // any change of the number of vCpus in the Basic settings requires recalculation of the numer of cores, sockets, threads
  getTopologySettings (vcpus, force = {}) {
    return getTopology({
      value: vcpus,
      max: {
        sockets: this.props.maxNumOfSockets,
        cores: this.props.maxNumOfCores,
        threads: this.props.maxNumOfThreads,
      },
      force: force,
    })
  }

  handleProvisionSourceChange (provisionSource) {
    const changes = {}
    const { defaultValues } = this.props

    changes.provisionSource = provisionSource
    changes.isoImage = undefined
    changes.templateId = undefined
    changes.operatingSystemId = defaultValues.operatingSystemId
    changes.memory = defaultValues.memory
    changes.cpus = defaultValues.cpus
    changes.topology = defaultValues.topology
    changes.optimizedFor = defaultValues.optimizedFor
    changes.cloudInitEnabled = defaultValues.initEnabled

    // when changing Provision type to ISO, set the default time zone according to the OS
    if (changes.provisionSource === 'iso') {
      changes.timeZone = this.checkTimeZone(changes.operatingSystemId, changes.templateId)
      changes.initTimezone = '' // reset the sysprep timezone value, we don't support cloud-init TZ yet
    }

    return changes
  }

  handleChange (field, value, extra) {
    // normalize the value for drop downs with a "-- Select --" option
    if (this.fields.select.includes(field) && value === '_') {
      value = undefined
    }

    // normalize check boxes
    if (this.fields.checkBoxes.includes(field)) {
      value = !!value || value === 'on'
    }

    let changes = {}
    switch (field) {
      case 'clusterId':
        const templateList = value ? createTemplateList(this.props.templates, value) : []
        changes.dataCenterId = value ? this.props.clusters.getIn([value, 'dataCenterId']) : undefined
        changes.clusterId = value
        changes.provisionSource =
            (templateList.length === 1 && templateList[0].id === this.props.blankTemplateId)
              ? 'iso'
              : 'template'
        changes.templateId = templateList.length === 1 ? this.props.blankTemplateId : undefined
        changes.isoImage = undefined
        break

      case 'provisionSource':
        changes = this.handleProvisionSourceChange(value)
        break

      case 'templateId':
        const template = this.props.templates.find(t => t.get('id') === value)
        changes.templateId = template.get('id')
        changes.memory = template.get('memory') / (1024 ** 2) // stored in bytes, input in Mib
        changes.cpus = template.getIn([ 'cpu', 'vCPUs' ])
        changes.topology = template.getIn([ 'cpu', 'topology' ]).toJS()
        changes.optimizedFor = template.get('type', this.props.data.optimizedFor)
        changes.operatingSystemId = this.props.operatingSystems
          .find(os => os.get('name') === template.getIn([ 'os', 'type' ]))
          .get('id')

        // Check template's timezone compatibility with the template's OS, set the timezone corresponding to the template's OS
        changes.timeZone = this.checkTimeZone(changes.operatingSystemId, changes.templateId)
        changes.cloudInitEnabled = template.getIn(['cloudInit', 'enabled'])
        changes.initHostname = template.getIn(['cloudInit', 'hostName'])
        changes.initSshKeys = template.getIn(['cloudInit', 'sshAuthorizedKeys'])
        changes.initTimezone = template.getIn(['cloudInit', 'timezone'])
        changes.initCustomScript = template.getIn(['cloudInit', 'customScript'])
        break

      case 'operatingSystemId':
        changes[field] = value
        changes.timeZone = this.checkTimeZone(value, this.props.data.templateId)
        break

      case 'memory':
        if (isNumberInRange(value, 0, this.props.maxMemorySizeInMiB)) {
          changes.memory = +value
        }
        break

      case 'cpus':
        if (isNumberInRange(value, 0, this.props.maxNumOfVmCpus)) {
          changes.cpus = +value
        }

        changes.topology = this.getTopologySettings(changes.cpus)
        break

      case 'topology': // number of sockets, cores or threads changed by the user in Advanced Options section
        changes[field] = this.getTopologySettings(this.props.data.cpus, { [extra.vcpu]: +value })
        break

      default:
        changes[field] = value
    }

    if (Object.keys(changes).length > 0) {
      const isFormValid = this.validateForm({ ...this.props.data, ...changes })
      this.props.onUpdate({ valid: isFormValid, partialUpdate: changes })
    }
  }

  mapVCpuTopologyItems (items) {
    return items.map(i =>
      ({
        id: i.toString(),
        value: i.toString(),
      })
    )
  }

  render () {
    const idPrefix = this.props.id || 'create-vm-wizard-basic'
    const { data, clusters, maxNumOfSockets, maxNumOfCores, maxNumOfThreads } = this.props
    const clusterList =
      createClusterList(clusters)
        .map(cluster => ({
          id: cluster.id,
          value: `${cluster.value} (${this.props.dataCenters.find(dc => dc.id === cluster.datacenter).name})`,
        }))
    if (!isValidUid(data.clusterId)) {
      clusterList.unshift({ id: '_', value: `-- ${msg.createVmWizardSelectCluster()} --` })
    }

    const provisionSourceList =
      [
        { id: 'iso', value: msg.createVmWizardSourceISO() },
        { id: 'template', value: msg.createVmWizardSourceTemplate() },
      ]
    if (!isValidSource(data.provisionSource)) {
      provisionSourceList.unshift({ id: '_', value: `-- ${msg.createVmWizardSelectProvisionSource()} --` })
    }

    const enableOsSelect = isValidUid(data.clusterId) && [ 'iso', 'template' ].includes(data.provisionSource)
    const operatingSystemList = enableOsSelect
      ? createOsList(data.clusterId, clusters, this.props.operatingSystems)
      : [ { id: '_', value: `-- ${msg.createVmWizardSelectClusterBeforeOS()} --` } ]

    const enableIsoSelect = data.provisionSource === 'iso' && isValidUid(data.dataCenterId)
    const isoList = enableIsoSelect
      ? createIsoList(this.props.storageDomains, data.dataCenterId)
        .map(iso => ({
          id: iso.file.id,
          value: iso.file.name,
        }))
        .sort((a, b) => localeCompare(a.value, b.value))
      : [ { id: '_', value: `-- ${msg.createVmWizardSelectClusterBeforeISO()} --` } ]
    if (enableIsoSelect && !isValidUid(data.isoImage)) {
      isoList.unshift({ id: '_', value: `-- ${msg.createVmWizardSelectISO()} --` })
    }

    const enableTemplateSelect = data.provisionSource === 'template'
    const templateList = enableTemplateSelect && isValidUid(data.clusterId)
      ? createTemplateList(this.props.templates, data.clusterId)
      : [ { id: '_', value: `-- ${msg.createVmWizardSelectClusterBeforeTemplate()} --` } ]
    if (enableTemplateSelect && isValidUid(data.clusterId) && !isValidUid(data.templateId)) {
      templateList.unshift({ id: '_', value: `-- ${msg.createVmWizardSelectTemplate()} --` })
    }

    const enableCloudInit = data.cloudInitEnabled && isOsLinux(data.operatingSystemId, this.props.operatingSystems)
    const enableSysPrep = data.cloudInitEnabled && isOsWindows(data.operatingSystemId, this.props.operatingSystems)

    // for Advanced CPU Topology Options expand/collapse section
    const vCpuTopologyDividers = getTopologyPossibleValues({
      value: data.cpus,
      maxNumberOfSockets: maxNumOfSockets,
      maxNumberOfCores: maxNumOfCores,
      maxNumberOfThreads: maxNumOfThreads,
    })
    // for Threads per Core tooltip
    const clusterId = data.clusterId || '_'
    const cluster = clusters && clusters.get(clusterId)
    const threadsTooltip = cluster && cluster.get('architecture') === 'ppc64'
      ? msg.recomendedPower8ValuesForThreads({ threads: maxNumOfThreads })
      : msg.recomendedValuesForThreads({ threads: maxNumOfThreads })

    // ----- RENDER -----
    return <Form horizontal id={idPrefix}>
      <Grid className={style['settings-container']}>
        {/* -- VM name and where it will live -- */}
        <FieldRow label={msg.name()} id={`${idPrefix}-name`} required validationState={this.validateVmName()}>
          <FormControl
            id={`${idPrefix}-name-edit`}
            autoComplete='off'
            type='text'
            defaultValue={data.name}
            onChange={e => this.handleChange('name', e.target.value)}
          />
        </FieldRow>

        <FieldRow label={msg.description()} id={`${idPrefix}-description`}>
          <FormControl
            id={`${idPrefix}-description-edit`}
            componentClass='textarea'
            defaultValue={data.description}
            onChange={e => this.handleChange('description', e.target.value)}
          />
        </FieldRow>

        <FieldRow label={msg.cluster()} id={`${idPrefix}-cluster`} required>
          <SelectBox
            id={`${idPrefix}-cluster-edit`}
            items={clusterList}
            selected={data.clusterId || '_'}
            onChange={selectedId => this.handleChange('clusterId', selectedId)}
          />
        </FieldRow>

        {/* -- Provision Source -- */}
        <FieldRow label={msg.provisionSource()} id={`${idPrefix}-provision`} required>
          <SelectBox
            id={`${idPrefix}-provision-edit`}
            items={provisionSourceList}
            selected={data.provisionSource || '_'}
            onChange={selectedId => this.handleChange('provisionSource', selectedId)}
          />
        </FieldRow>

        {/* -- Provision Source: ISO -- */}
        { data.provisionSource === 'iso' &&
          <FieldRow label={msg.cd()} id={`${idPrefix}-iso`} required>
            <SelectBox
              id={`${idPrefix}-iso-edit`}
              items={isoList}
              selected={data.isoImage || '_'}
              onChange={selectedId => this.handleChange('isoImage', selectedId)}
            />
          </FieldRow>
        }

        {/* -- Provision Source: Template -- */}
        { data.provisionSource === 'template' &&
          <FieldRow label={msg.template()} id={`${idPrefix}-template`} required>
            <SelectBox
              id={`${idPrefix}-template-edit`}
              items={templateList}
              selected={data.templateId || '_'}
              onChange={selectedId => this.handleChange('templateId', selectedId)}
            />
          </FieldRow>
        }

        {/* -- Common -- */}
        <FieldRow label={msg.operatingSystem()} id={`${idPrefix}-os`} required>
          <SelectBox
            id={`${idPrefix}-os-edit`}
            items={operatingSystemList}
            selected={enableOsSelect ? (data.operatingSystemId || '0') : '_'}
            onChange={selectedId => this.handleChange('operatingSystemId', selectedId)}
          />
        </FieldRow>

        <FieldRow label={`${msg.memory()} (MiB)`} id={`${idPrefix}-memory`} required>
          <FormControl
            id={`${idPrefix}-memory-edit`}
            className={style['memory-input']}
            type='number'
            value={data.memory}
            onChange={e => this.handleChange('memory', e.target.value)}
          />
        </FieldRow>

        <FieldRow label={msg.cpus()} id={`${idPrefix}-cpus`} required>
          <FormControl
            id={`${idPrefix}-cpus-edit`}
            className={style['cpus-input']}
            type='number'
            value={data.cpus}
            onChange={e => this.handleChange('cpus', e.target.value)}
          />
        </FieldRow>

        <FieldRow label={msg.optimizedFor()} id={`${idPrefix}-optimizedFor`} required>
          <SelectBox
            id={`${idPrefix}-optimizedFor-edit`}
            items={Object.values(optimizedForMap)}
            selected={data.optimizedFor || '_'}
            onChange={selectedId => this.handleChange('optimizedFor', selectedId)}
          />
        </FieldRow>

        <FieldRow id={`${idPrefix}-startOnCreation`}>
          <Checkbox
            id={`${idPrefix}-startOnCreation-edit`}
            checked={!!data.startOnCreation}
            onChange={e => this.handleChange('startOnCreation', e.target.checked)}
          >
            {msg.startVmOnCreation()}
          </Checkbox>
        </FieldRow>

        {/* -- Cloud-Init -- */}
        <FieldRow id={`${idPrefix}-cloudInitEnabled`} rowClassName={style['cloud-init']}>
          <Checkbox
            id={`${idPrefix}-cloudInitEnabled-edit`}
            checked={!!data.cloudInitEnabled}
            onChange={e => this.handleChange('cloudInitEnabled', e.target.checked)}
          >
            {msg.cloudInitEnable()}
          </Checkbox>
        </FieldRow>

        { enableCloudInit &&
          <React.Fragment>
            <SubHeading>{msg.cloudInitOptions()}</SubHeading>

            {/* TODO: cloud-init/linux hostname field level validation? */}
            <FieldRow label={msg.hostName()} id={`${idPrefix}-cloudInitHostname`} vertical>
              <FormControl
                id={`${idPrefix}-cloudInitHostname-edit`}
                type='text'
                defaultValue={data.initHostname}
                onChange={e => this.handleChange('initHostname', e.target.value)}
              />
            </FieldRow>

            <FieldRow label={msg.sshAuthorizedKeys()} id={`${idPrefix}-cloudInitSshKeys`} vertical>
              <FormControl
                id={`${idPrefix}-cloudInitSshKeys-edit`}
                componentClass='textarea'
                rows={5}
                defaultValue={data.initSshKeys}
                onChange={e => this.handleChange('initSshKeys', e.target.value)}
              />
            </FieldRow>
          </React.Fragment>
        }

        { enableSysPrep &&
          <React.Fragment>
            <SubHeading>{msg.sysPrepOptions()}</SubHeading>

            {/* TODO: sysprep/windows hostname field level validation? */}
            <FieldRow label={msg.hostName()} id={`${idPrefix}-sysPrepHostname`} vertical>
              <FormControl
                id={`${idPrefix}-sysPrepHostname-edit`}
                type='text'
                defaultValue={data.initHostname}
                onChange={e => this.handleChange('initHostname', e.target.value)}
              />
            </FieldRow>

            <FieldRow label={msg.sysPrepTimezone()} id={`${idPrefix}-sysPrepTimezone`} vertical>
              <SelectBox
                id={`${idPrefix}-sysprep-timezone-select`}
                items={timezones}
                selected={data.initTimezone}
                onChange={selectedId => this.handleChange('initTimezone', selectedId)}
              />
            </FieldRow>

            <FieldRow label={msg.sysPrepAdministratorPassword()} id={`${idPrefix}-sysPrepAdminPassword`} vertical>
              <FormControl
                id={`${idPrefix}-sysPrepAdminPassword-edit`}
                type='password'
                defaultValue={data.initAdminPassword}
                onChange={e => this.handleChange('initAdminPassword', e.target.value)}
              />
            </FieldRow>

            <FieldRow label={msg.sysPrepCustomScript()} id={`${idPrefix}-sysPrepCustomScript`} vertical>
              <FormControl
                id={`${idPrefix}-sysPrepCustomScript-edit`}
                componentClass='textarea'
                rows={5}
                defaultValue={data.initCustomScript}
                onChange={e => this.handleChange('initCustomScript', e.target.value)}
              />
            </FieldRow>
          </React.Fragment>
        }
      </Grid>

      {/* Advanced CPU Topology Options */}
      <ExpandCollapse id={`${idPrefix}-advanced-options`} textCollapsed={msg.advancedCpuTopologyOptions()} textExpanded={msg.advancedCpuTopologyOptions()}>
        <Grid className={style['settings-container']}>
          <FieldRow fieldCols={3} label={msg.virtualSockets()} id={`${idPrefix}-topology-sockets`}>
            <SelectBox
              id={`${idPrefix}-topology-sockets-edit`}
              items={this.mapVCpuTopologyItems(vCpuTopologyDividers.sockets)}
              selected={data.topology.sockets.toString()}
              onChange={selectedId => { this.handleChange('topology', selectedId, { vcpu: 'sockets' }) }}
            />
          </FieldRow>
          <FieldRow fieldCols={3} label={msg.coresPerSockets()} id={`${idPrefix}-topology-cores`}>
            <SelectBox
              id={`${idPrefix}-topology-cores-edit`}
              items={this.mapVCpuTopologyItems(vCpuTopologyDividers.cores)}
              selected={data.topology.cores.toString()}
              onChange={selectedId => { this.handleChange('topology', selectedId, { vcpu: 'cores' }) }}
            />
          </FieldRow>
          <FieldRow
            fieldCols={3}
            label={msg.threadsPerCores()}
            id={`${idPrefix}-topology-threads`}
            tooltip={threadsTooltip}
          >
            <SelectBox
              id={`${idPrefix}-topology-threads-edit`}
              items={this.mapVCpuTopologyItems(vCpuTopologyDividers.threads)}
              selected={data.topology.threads.toString()}
              onChange={selectedId => { this.handleChange('topology', selectedId, { vcpu: 'threads' }) }}
            />
          </FieldRow>
        </Grid>
      </ExpandCollapse>
    </Form>
  }
}

BasicSettings.propTypes = {
  id: PropTypes.string,
  data: PropTypes.shape(BASIC_DATA_SHAPE),
  defaultValues: PropTypes.shape(BASIC_DATA_SHAPE),

  dataCenters: PropTypes.object.isRequired,
  clusters: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,
  blankTemplateId: PropTypes.string.isRequired,
  storageDomains: PropTypes.object.isRequired,
  maxNumOfVmCpus: PropTypes.number.isRequired,
  maxMemorySizeInMiB: PropTypes.number.isRequired,

  maxNumOfSockets: PropTypes.number.isRequired,
  maxNumOfCores: PropTypes.number.isRequired,
  maxNumOfThreads: PropTypes.number.isRequired,

  onUpdate: PropTypes.func.isRequired,

  defaultGeneralTimezone: PropTypes.string.isRequired,
  defaultWindowsTimezone: PropTypes.string.isRequired,
}

export default connect(
  (state) => ({
    dataCenters: state.dataCenters,
    clusters: state.clusters,
    operatingSystems: state.operatingSystems,
    templates: state.templates,
    blankTemplateId: state.config.get('blankTemplateId'),
    storageDomains: state.storageDomains,
    maxNumOfVmCpus: state.config.get('maxNumOfVmCpus', 384),
    maxMemorySizeInMiB: 4194304, // TODO: 4TiB, no config option pulled as of 2019-Mar-22
    defaultGeneralTimezone: state.config.get('defaultGeneralTimezone'),
    defaultWindowsTimezone: state.config.get('defaultWindowsTimezone'),
    maxNumOfSockets: state.config.get('maxNumberOfSockets'),
    maxNumOfCores: state.config.get('maxNumberOfCores'),
    maxNumOfThreads: state.config.get('maxNumberOfThreads'),
  })
)(BasicSettings)
