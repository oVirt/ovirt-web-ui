import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { localeCompare } from '_/helpers'
import { withMsg } from '_/intl'
import { isNumberInRange } from '_/utils'
import { BASIC_DATA_SHAPE } from '../dataPropTypes'
import {
  handleClusterIdChange,
  handleProvisionSourceChange,
  handleTemplateIdChange,
  checkTimeZone,
  isOsLinux,
  isOsWindows,
} from '../helpers'

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
  Form,
  FormControl,
  HelpBlock,
  Checkbox,
} from 'patternfly-react'
import { Grid, Row, Col } from '_/components/Grid'
import SelectBox from '_/components/SelectBox'

import timezones from '_/components/utils/timezones.json'

import style from './style.css'
import { InfoTooltip } from '_/components/tooltips'

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
  errorMessage,
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
          {(validationState && errorMessage) &&
            <HelpBlock>{errorMessage}</HelpBlock>
          }
        </Col>
      </React.Fragment>
    }
    { !vertical &&
      <React.Fragment>
        <Col cols={labelCols} className={`control-label ${style['col-label']}`}>
          {label}
          { tooltip &&
            <InfoTooltip
              tooltip={tooltip}
              id={`${id}-tooltip`}
            />
          }
        </Col>
        <Col cols={fieldCols} className={style['col-data']} id={id}>
          {children}
          {(validationState && errorMessage) &&
            <HelpBlock>{errorMessage}</HelpBlock>
          }
        </Col>
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
  errorMessage: PropTypes.string,
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

export const optimizedForMap = (msg) => ({
  'desktop': { id: 'desktop', value: msg.vmType_desktop() },
  'server': { id: 'server', value: msg.vmType_server() },
  'high_performance': { id: 'high_performance', value: msg.vmType_highPerformance() },
})

/**
 * Basic Setting Wizard Step #1
 *
 */
class BasicSettings extends React.Component {
  constructor (props) {
    super(props)
    this.getTopologySettings = this.getTopologySettings.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.validateForm = this.validateForm.bind(this)
    this.validateVmName = this.validateVmName.bind(this)
    this.mapVCpuTopologyItems = this.mapVCpuTopologyItems.bind(this)
    this.buildOptimizedForList = this.buildOptimizedForList.bind(this)
    this.grabCpuOptions = this.grabCpuOptions.bind(this)

    this.fields = {
      select: [
        'clusterId', 'provisionSource', 'templateId', 'isoImage', 'optimizedFor',
      ],
      checkBoxes: [
        'startOnCreation', 'cloudInitEnabled',
      ],
    }
  }

  validateForm (dataSet) {
    const {
      msg,
      dataCenters, clusters, storageDomains, templates, operatingSystems,
      maxMemorySizeInMiB,
    } = this.props
    const { maxNumOfVmCpus } = this.grabCpuOptions()

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

    const okCpu = isNumberInRange(dataSet.cpus, 0, maxNumOfVmCpus)

    const okOperatingSystem = dataSet.operatingSystemId && operatingSystems.find(os => os.get('id') === dataSet.operatingSystemId) !== undefined
    const okMemory = isNumberInRange(dataSet.memory, 0, maxMemorySizeInMiB)
    const okOptimizedFor = dataSet.optimizedFor && this.buildOptimizedForList(dataSet, msg)[dataSet.optimizedFor] !== undefined

    const checkInit = dataSet.cloudInitEnabled
    const okInitHostname = dataSet.initHostname ? isHostNameValid(dataSet.initHostname) : true

    return okName &&
      okDataCenter && okCluster &&
      okProvision && (okProvisionIso || okProvisionTemplate) &&
      okOperatingSystem && okMemory && okCpu && okOptimizedFor &&
      (checkInit ? okInitHostname : true)
  }

  /**
   * supports in showing high performance option only for HP template based vm.
   * TODO remove when REST API will fully support creating of a High Performance VM type, not based on a template
   **/
  buildOptimizedForList (dataSet, msg) {
    const optimizedForList = { ...optimizedForMap(msg) }

    const template = this.props.templates.find(template => template.get('id') === dataSet.templateId)
    const templateOrigOptimizedFor = template && template.get('type')
    if (dataSet.provisionSource !== 'template' || templateOrigOptimizedFor !== 'high_performance') {
      delete optimizedForList.high_performance
    } else {
      delete optimizedForList.desktop
      delete optimizedForList.server
    }

    return optimizedForList
  }

  validateVmName () {
    const name = this.props.data.name
    return name === undefined || name.length === 0 || !isVmNameValid(name) ? 'error' : null
  }

  // Calculate the proper number of virtual sockets, cores per virtual socket, threads per core according to the number of virtual CPUs
  // any change of the number of vCpus in the Basic settings requires recalculation of the numer of cores, sockets, threads
  getTopologySettings (vcpus, force = {}) {
    const { maxNumOfSockets, maxNumOfCores, maxNumOfThreads } = this.grabCpuOptions()
    return getTopology({
      value: vcpus,
      max: {
        sockets: maxNumOfSockets,
        cores: maxNumOfCores,
        threads: maxNumOfThreads,
      },
      force: force,
    })
  }

  grabCpuOptions () {
    const { data, clusters, templates } = this.props

    // No cluster has been selected yet.........
    if (!isValidUid(data.clusterId)) {
      return {
        maxNumOfSockets: 1,
        maxNumOfCores: 1,
        maxNumOfThreads: 1,
        maxNumOfVmCpus: 1,
      }
    }

    // CPU options come from the selected Template (if selected and defined there) or Cluster
    const template = templates.get(data.templateId)
    const cluster = clusters.get(data.clusterId)

    const cpuOptions = (template && template.get('cpuOptions')) || cluster.get('cpuOptions')
    return {
      maxNumOfSockets: cpuOptions.get('maxNumOfSockets'),
      maxNumOfCores: cpuOptions.get('maxNumOfCores'),
      maxNumOfThreads: cpuOptions.get('maxNumOfThreads'),
      maxNumOfVmCpus: cpuOptions.get('maxNumOfVmCpus'),
    }
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
        changes = handleClusterIdChange(value, this.props)
        break

      case 'provisionSource':
        changes = handleProvisionSourceChange(value, this.props)
        break

      case 'templateId':
        const { data: { optimizedFor } } = this.props
        changes = handleTemplateIdChange(value, optimizedFor, this.props)
        break

      case 'operatingSystemId':
        changes[field] = value
        const { data: { templateId } } = this.props
        changes.timeZone = checkTimeZone(value, templateId, this.props)
        // only when changing the OS from one Windows to other Windows
        changes.initTimezone = this.props.data.cloudInitEnabled && this.props.data.enableInitTimezone && isOsWindows(value, this.props.operatingSystems)
          ? this.props.data.lastInitTimezone // set the sysprep timezone as the last selected sysprep timezone
          : ''
        break

      case 'memory':
        if (isNumberInRange(value, 0, this.props.maxMemorySizeInMiB)) {
          changes.memory = +value
        }
        break

      case 'cpus':
        const { maxNumOfVmCpus } = this.grabCpuOptions()
        if (isNumberInRange(value, 0, maxNumOfVmCpus)) {
          changes.cpus = +value
        }

        changes.topology = this.getTopologySettings(changes.cpus)
        break

      case 'topology': // number of sockets, cores or threads changed by the user in Advanced Options section
        changes[field] = this.getTopologySettings(this.props.data.cpus, { [extra.vcpu]: +value })
        break

      case 'enableInitTimezone': // Configure Timezone checkbox change
        changes[field] = value
        // if the Configure Timezone checkbox checked, set the sysprep timezone
        changes.initTimezone = value ? this.props.data.initTimezone || this.props.data.lastInitTimezone : ''
        break

      case 'initTimezone': // sysprep timezone change
        changes[field] = value
        changes.lastInitTimezone = value // save the actual selected sysprep timezone
        break

      case 'cloudInitEnabled': // Cloud-init/Sysprep checkbox change
        changes[field] = value
        changes.initTimezone = value && this.props.data.enableInitTimezone && isOsWindows(this.props.data.operatingSystemId, this.props.operatingSystems)
          ? this.props.data.lastInitTimezone
          : ''
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
    const {
      data, clusters,
      operatingSystems, id, dataCenters,
      storageDomains, templates, msg, locale,
    } = this.props

    const idPrefix = id || 'create-vm-wizard-basic'

    const indicators = {
      name: this.validateVmName(),
      hostName: !isHostNameValid(data.initHostname || ''),
    }

    const clusterList =
      createClusterList({ clusters, locale })
        .map(cluster => ({
          id: cluster.id,
          value: `${cluster.value} (${dataCenters.find(dc => dc.id === cluster.datacenter).name})`,
        }))
    if (!isValidUid(data.clusterId)) {
      clusterList.unshift({ id: '_', value: clusterList.length === 0 ? `-- ${msg.noClustersAvailable()} --` : `-- ${msg.createVmWizardSelectCluster()} --` })
      indicators.cluster = !indicators.name && 'error'
    } else {
      delete indicators.cluster
    }

    const provisionSourceList =
      [
        { id: 'iso', value: msg.createVmWizardSourceISO() },
        { id: 'template', value: msg.createVmWizardSourceTemplate() },
      ]
    if (!isValidSource(data.provisionSource)) {
      provisionSourceList.unshift({ id: '_', value: `-- ${msg.createVmWizardSelectProvisionSource()} --` })
      indicators.provisionSource = !indicators.cluster && 'error'
    } else {
      delete indicators.provisionSource
    }

    const enableOsSelect = isValidUid(data.clusterId) && [ 'iso', 'template' ].includes(data.provisionSource)
    const operatingSystemList = enableOsSelect
      ? createOsList({ clusterId: data.clusterId, clusters, operatingSystems, locale })
      : [ { id: '_', value: `-- ${msg.createVmWizardSelectClusterBeforeOS()} --` } ]

    const enableIsoSelect = data.provisionSource === 'iso' && isValidUid(data.dataCenterId)
    const isoList = enableIsoSelect
      ? createIsoList(storageDomains, data.dataCenterId)
        .map(iso => ({
          id: iso.file.id,
          value: iso.file.name,
        }))
        .sort((a, b) => localeCompare(a.value, b.value, locale))
      : [ { id: '_', value: `-- ${msg.createVmWizardSelectClusterBeforeISO()} --` } ]
    if (enableIsoSelect && !isValidUid(data.isoImage)) {
      isoList.unshift({ id: '_', value: isoList.length === 0 ? `-- ${msg.noCdsAvailable()} --` : `-- ${msg.createVmWizardSelectISO()} --` })
      indicators.isoList = !indicators.provisionSource && !indicators.name && 'error'
    } else {
      delete indicators.isoList
    }

    const enableTemplateSelect = data.provisionSource === 'template'
    const templateList = enableTemplateSelect && isValidUid(data.clusterId)
      ? createTemplateList({ templates, clusterId: data.clusterId, locale })
      : [ { id: '_', value: `-- ${msg.createVmWizardSelectClusterBeforeTemplate()} --` } ]
    if (enableTemplateSelect && isValidUid(data.clusterId) && !isValidUid(data.templateId)) {
      templateList.unshift({ id: '_', value: `-- ${msg.createVmWizardSelectTemplate()} --` })
      indicators.template = !indicators.provisionSource && !indicators.name && 'error'
    } else {
      delete indicators.template
    }

    const enableCloudInit = data.cloudInitEnabled && isOsLinux(data.operatingSystemId, operatingSystems)
    const enableSysPrep = data.cloudInitEnabled && isOsWindows(data.operatingSystemId, operatingSystems)

    // for Advanced CPU Topology Options expand/collapse section
    const { maxNumOfSockets, maxNumOfCores, maxNumOfThreads } = this.grabCpuOptions()
    const vCpuTopologyDividers = getTopologyPossibleValues({
      value: data.cpus,
      maxNumOfSockets,
      maxNumOfCores,
      maxNumOfThreads,
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
        <FieldRow label={msg.name()} id={`${idPrefix}-name`} required validationState={indicators.name} errorMessage={data.name ? msg.pleaseEnterValidVmName() : ''}>
          <FormControl
            id={`${idPrefix}-name-edit`}
            autoFocus
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
            validationState={indicators.cluster}
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
              validationState={indicators.isoList}
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
              validationState={indicators.template}
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
            items={Object.values(this.buildOptimizedForList(data, msg))}
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

            <FieldRow
              label={msg.hostName()}
              id={`${idPrefix}-cloudInitHostname`}
              vertical
              validationState={data.initHostname && indicators.hostName ? 'error' : undefined}
              errorMessage={msg.pleaseEnterValidHostName()}
            >
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

            <FieldRow
              label={msg.hostName()}
              id={`${idPrefix}-sysPrepHostname`}
              vertical
              validationState={data.initHostname && indicators.hostName ? 'error' : undefined}
              errorMessage={msg.pleaseEnterValidHostName()}
            >
              <FormControl
                id={`${idPrefix}-sysPrepHostname-edit`}
                type='text'
                defaultValue={data.initHostname}
                onChange={e => this.handleChange('initHostname', e.target.value)}
              />
            </FieldRow>

            {/*  Configure Timezone checkbox */}
            <FieldRow id={`${idPrefix}-sysPrepTimezone-configure`} vertical>
              <Checkbox
                id={`${idPrefix}-sysprep-timezone-config`}
                checked={data.enableInitTimezone}
                onChange={e => this.handleChange('enableInitTimezone', e.target.checked)}
              >
                {msg.sysPrepTimezoneConfigure()}
              </Checkbox>
            </FieldRow>

            <FieldRow label={msg.sysPrepTimezone()} id={`${idPrefix}-sysPrepTimezone`} vertical>
              <SelectBox
                id={`${idPrefix}-sysprep-timezone-select`}
                items={timezones}
                selected={data.lastInitTimezone}
                onChange={selectedId => this.handleChange('initTimezone', selectedId)}
                disabled={!data.enableInitTimezone}
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

  // todo remove the 'eslint-disable-next-line' below when updating the eslint to newer version
  // eslint-disable-next-line react/no-unused-prop-types
  defaultValues: PropTypes.shape(BASIC_DATA_SHAPE),

  dataCenters: PropTypes.object.isRequired,
  clusters: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  blankTemplateId: PropTypes.string.isRequired,
  storageDomains: PropTypes.object.isRequired,
  maxMemorySizeInMiB: PropTypes.number.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  defaultGeneralTimezone: PropTypes.string.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  defaultWindowsTimezone: PropTypes.string.isRequired,

  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,

  onUpdate: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    dataCenters: state.dataCenters,
    clusters: state.clusters,
    operatingSystems: state.operatingSystems,
    templates: state.templates,
    blankTemplateId: state.config.get('blankTemplateId'),
    storageDomains: state.storageDomains,
    maxMemorySizeInMiB: 4194304, // TODO: 4TiB, no config option pulled as of 2019-Mar-22
    defaultGeneralTimezone: state.config.get('defaultGeneralTimezone'),
    defaultWindowsTimezone: state.config.get('defaultWindowsTimezone'),
  })
)(withMsg(BasicSettings))
