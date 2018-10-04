import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import AppConfiguration from '../../config'
import { msg } from '../../intl'

import style from './style.css'
import sharedStyle from '../sharedStyle.css'

import {
  getConsoleOptions,
  saveConsoleOptions,
} from '../../actions'

import { templateNameRenderer, userFormatOfBytes } from '../../helpers'

import ConsoleOptions from '../ConsoleOptions'
import DetailContainer from '../DetailContainer'
import FieldHelp from '../FieldHelp'
import LastMessage from './LastMessage'
import VmConsoles from './VmConsoles'
import VmDisks from '../VmDisks'
import VmIcon from '../VmIcon'
import VmNics from '../VmNics'
import VmsListNavigation from '../VmsListNavigation'
import VmStatus from './VmStatus'
import { NextRunLabel } from './labels'

import Selectors from '../../selectors'
import { getOsHumanName, getVmIcon } from '../utils'

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

  console.info('rephraseVmType(): vmType not explicitly defined: ', vmType)
  return vmType
}

class VmDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      openConsoleSettings: false,
      vmsNavigationExpanded: true,
      editDisks: false,
    }

    this.consoleSettings = this.consoleSettings.bind(this)
    this.toggleVmsNavExpansion = this.toggleVmsNavExpansion.bind(this)
    this.editDisks = this.editDisks.bind(this)
  }

  toggleVmsNavExpansion (e) {
    this.setState({
      vmsNavigationExpanded: !this.state.vmsNavigationExpanded,
    })

    e.preventDefault()
  }

  editDisks (e) {
    e.preventDefault()
    this.setState({ editDisks: !this.state.editDisks })
  }

  consoleSettings (e) {
    this.props.onConsoleOptionsOpen()
    this.setState({
      openConsoleSettings: !this.state.openConsoleSettings,
    })

    e.preventDefault()
  }

  nicSettings (e) {
    this.setState({
      openNicSettings: !this.state.openNicSettings,
    })

    e.preventDefault()
  }

  render () {
    const {
      vm,
      pool,
      icons,
      options,
      userMessages,
      operatingSystems,
      onConsoleOptionsSave,
    } = this.props

    const sequence = [ 'first', 'second' ]

    const isPool = !!pool
    const isPoolVm = !!vm.getIn(['pool', 'id'])
    const name = isPool ? pool.get('name') : vm.get('name')
    const idPrefix = `vmdetail-${name}`
    const icon = getVmIcon(icons, operatingSystems, vm)
    const disks = vm.get('disks')
    const nics = vm.get('nics')
    const osName = getOsHumanName(vm.getIn(['os', 'type']))
    const cluster = Selectors.getClusterById(vm.getIn(['cluster', 'id']))
    const template = Selectors.getTemplateById(vm.getIn(['template', 'id']))

    const disksElement = (<VmDisks disks={disks} vmId={vm.get('id')} edit={this.state.editDisks} />)

    const diskEditAllowed = !isPool && !isPoolVm
    const pencilIcon = (<i className={`pficon pficon-edit`} />)
    const disksEditPencil = (
      <small className={style.editPencilLink}>
        {
          diskEditAllowed
            ? (<a href='#' onClick={this.editDisks} id={`${idPrefix}-edit-disks`}>{pencilIcon}</a>)
            : (<FieldHelp content={msg.notEditableForPoolsOrPoolVms()} text={pencilIcon} />)
        }
      </small>)

    let optionsJS = options.hasIn(['options', 'consoleOptions', vm.get('id')]) ? options.getIn(['options', 'consoleOptions', vm.get('id')]).toJS() : {}

    const consoleOptionsShowHide = (
      <small className={style.editPencilLink}>
        <a href='#' onClick={this.consoleSettings} id={`${idPrefix}-consoleoptions-showhide`}>
          <i className={`pficon pficon-edit`} />
        </a>
      </small>)

    const notPoolOrPoolVm = !isPool && vm.getIn(['pool', 'id']) === undefined

    const hasDisks = disks.size > 0
    const noDisks = hasDisks || (<small>{msg.noDisks()} &nbsp;</small>)

    const consolesHelp = (
      <div>
        <p id={`${idPrefix}-consolehelp-one`}>{msg.ifVmIsRunningClickToAccessItsGraphicsConsole()}</p>
        <p id={`${idPrefix}-consolehelp-two`} dangerouslySetInnerHTML={{ __html: msg.htmlPleaseReferToDocumentationForMoreInformation({ documentationUrl: AppConfiguration.consoleClientResourcesURL }) }} />
      </div>
    )

    let vmIcon = (<VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' />)

    if (isPool) {
      vmIcon = <VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' />
    }

    return (
      <div className={`detail-container ${style['main-container']}`} data-thisisvmdetail>
        <VmsListNavigation selectedVm={vm} expanded={this.state.vmsNavigationExpanded} toggleExpansion={this.toggleVmsNavExpansion} />
        <div className={style['vm-detail-main']} container='true'>
          <div className={this.state.vmsNavigationExpanded ? style['vms-nav-expanded'] : style['vms-nav-collapsed']}>
            <DetailContainer>
              <h1 className={style['header']}>
                {vmIcon}
                &nbsp;<span className={style['vm-name']} id={`${idPrefix}-name`}>{name}</span>
              </h1>
              <NextRunLabel vm={vm} />
              <LastMessage vm={vm} userMessages={userMessages} />
              <div className={style['vm-detail-container']}>
                <dl className={sharedStyle['vm-properties']}>
                  <dt>
                    <FieldHelp content={msg.actualStateVmIsIn()} text={msg.state()} />
                  </dt>
                  <dd>
                    <VmStatus vm={vm} />
                  </dd>

                  <dt>
                    <FieldHelp content={msg.optionalUserDescriptionOfVm()} text={msg.description()} />
                  </dt>
                  <dd id={`${idPrefix}-description`}>{vm.get('description')}</dd>

                  <dt>
                    <FieldHelp content={msg.groupOfHostsVmCanBeRunningOn()} text={msg.cluster()} />
                  </dt>
                  <dd id={`${idPrefix}-cluster`}>{cluster ? cluster.get('name') : ''}</dd>

                  <dt>
                    <FieldHelp content={msg.containsConfigurationAndDisksWhichWillBeUsedToCreateThisVm()} text={msg.template()} />
                  </dt>
                  <dd id={`${idPrefix}-template`}>{template ? templateNameRenderer(template) : ''}</dd>

                  <dt>
                    <FieldHelp content={msg.operatingSystemInstalledOnVm()} text={msg.operatingSystem()} />
                  </dt>
                  <dd id={`${idPrefix}-osname`}>{osName}</dd>

                  <dt>
                    <FieldHelp content={msg.typeOfWorkloadVmConfigurationIsOptimizedFor()} text={msg.optimizedFor()} />
                  </dt>
                  <dd id={`${idPrefix}-type`}>{rephraseVmType(vm.get('type'))}</dd>

                  <dt><span className='pficon pficon-memory' />&nbsp;
                    <FieldHelp content={msg.totalMemoryVmWillBeEquippedWith()} text={msg.definedMemory()} />
                  </dt>
                  <dd id={`${idPrefix}-memory`}>{userFormatOfBytes(vm.getIn(['memory', 'total'])).str}</dd>

                  <dt><span className='pficon pficon-cpu' />&nbsp;
                    <FieldHelp content={msg.totalCountOfVirtualProcessorsVmWillBeEquippedWith()} text={msg.cpus()} />
                  </dt>
                  <dd id={`${idPrefix}-cpu`}>{vm.getIn(['cpu', 'vCPUs'])}</dd>

                  <dt><span className='pficon pficon-network' />&nbsp;
                    <FieldHelp content={msg.fullyQualifiedDomainName()} text={msg.address()} />
                  </dt>
                  <dd id={`${idPrefix}-fqdn`}>{vm.get('fqdn')}</dd>

                  <dt><span className='pficon pficon-storage-domain' />&nbsp;
                    <FieldHelp content={msg.currentlyInsertedIsoInCdDrive()} text={msg.cd()} />
                  </dt>
                  <dd id={`${idPrefix}-cdrom`}>{vm.getIn(['cdrom', 'fileId']) ? vm.getIn(['cdrom', 'fileId']) : msg.empty() }</dd>
                </dl>

                <dl className={sharedStyle['vm-properties']}>
                  <dt><span className='pficon pficon-screen' />
                    &nbsp;
                    <FieldHelp content={consolesHelp} text={msg.console()} />
                    {consoleOptionsShowHide}
                  </dt>
                  <VmConsoles vm={vm} />
                  <ConsoleOptions smartcardOptionEnable={vm.getIn(['display', 'smartcardEnabled'])} options={optionsJS} onSave={onConsoleOptionsSave} open={this.state.openConsoleSettings} />

                  <dt>
                    <span className='fa fa-database' />
                    &nbsp;
                    <FieldHelp content={msg.storageConnectedToVm()} text={msg.disks()} />
                    {disksEditPencil}
                  </dt>
                  {noDisks}
                  {disksElement}
                  <VmNics nics={nics} vmId={vm.get('id')} enableSettings={notPoolOrPoolVm} />
                  <dt>
                    <FieldHelp content={msg.bootMenuTooltip()} text={msg.bootMenu()} />
                  </dt>
                  <dd>{vm.get('bootMenuEnabled') ? msg.on() : msg.off()}</dd>
                  <dt>
                    <FieldHelp content={msg.bootSequenceTooltip()} text={msg.bootSequence()} />
                  </dt>
                  <dd />
                  {vm.getIn(['os', 'bootDevices']).splice(2).map((device, key) =>
                    <React.Fragment key={key}>
                      <dt className={style['field-shifted']}>
                        <FieldHelp content={msg[`${sequence[key]}DeviceTooltip`]()} text={msg[`${sequence[key]}Device`]()} />
                      </dt>
                      <dd>
                        {msg[`${device}Boot`]()}
                      </dd>
                    </React.Fragment>
                  )}
                  <dt>
                    <FieldHelp content={msg.cloudInitTooltip()} text={msg.cloudInit()} />
                  </dt>
                  <dd>{vm.getIn(['cloudInit', 'enabled']) ? msg.on() : msg.off()}</dd>
                </dl>
              </div>
            </DetailContainer>
          </div>
        </div>
      </div>
    )
  }
}
VmDetail.propTypes = {
  vm: PropTypes.object,
  pool: PropTypes.object,

  icons: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired, // deep immutable, {[id: string]: OperatingSystem}
  userMessages: PropTypes.object.isRequired,

  onConsoleOptionsSave: PropTypes.func.isRequired,
  onConsoleOptionsOpen: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    icons: state.icons,
    options: state.options,
    operatingSystems: state.operatingSystems,
    userMessages: state.userMessages,
  }),

  (dispatch, { vm }) => ({
    onConsoleOptionsSave: ({ options }) => dispatch(saveConsoleOptions({ vmId: vm.get('id'), options })),
    onConsoleOptionsOpen: () => dispatch(getConsoleOptions({ vmId: vm.get('id') })),
  })
)(VmDetail)
