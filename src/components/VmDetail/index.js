import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import AppConfiguration from '../../config'
import { msg } from '../../intl'

import style from './style.css'
import sharedStyle from '../sharedStyle.css'

import {
  downloadConsole,
  getConsoleOptions,
  saveConsoleOptions,
  getRDP,
  changeVmIcon,
  changeVmIconById,
} from '../../actions/index'

import { templateNameRenderer } from '../../helpers'

import FieldHelp from '../FieldHelp/index'
import DetailContainer from '../DetailContainer'
import ConsoleOptions from '../ConsoleOptions/index'
import VmDisks from '../VmDisks/index'
import VmsListNavigation from '../VmsListNavigation/index'
import VmStatus from './VmStatus'
import { NextRunLabel } from './labels'
import LastMessage from './LastMessage'
import VmConsoles from './VmConsoles'

import { userFormatOfBytes, VmIcon } from 'ovirt-ui-components'
import Selectors from '../../selectors'
import { getOsHumanName } from '../utils'

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

  console.info('rephraseVmType(): vmType not explicitely defined: ', vmType)
  return vmType
}

class VmDetail extends Component {
  constructor (props) {
    super(props)
    this.state = {
      renderDisks: true,
      openConsoleSettings: false,
      vmsNavigationExpanded: true,
    }

    this.consoleSettings = this.consoleSettings.bind(this)
    this.toggleVmsNavExpansion = this.toggleVmsNavExpansion.bind(this)
    this.handleIconChange = this.handleIconChange.bind(this)
    this.handleIconChangeToDefault = this.handleIconChangeToDefault.bind(this)
  }

  toggleVmsNavExpansion (e) {
    this.setState({
      vmsNavigationExpanded: !this.state.vmsNavigationExpanded,
    })

    e.preventDefault()
  }

  consoleSettings (e) {
    this.props.onConsoleOptionsOpen()
    this.setState({
      openConsoleSettings: !this.state.openConsoleSettings,
    })

    e.preventDefault()
  }

  handleIconChange (e) {
    const that = this
    const reader = new FileReader()
    const file = e.target.files[0]

    reader.onload = function (upload) {
      let iconBase64 = upload.target.result
      iconBase64 = iconBase64.replace('data:', '')
      const semiIndex = iconBase64.indexOf(';')
      const mimeType = iconBase64.slice(0, semiIndex)
      iconBase64 = iconBase64.slice(semiIndex + 1).replace('base64,', '')

      that.props.onIconChange({ iconBase64, mimeType })
    }
    reader.readAsDataURL(file)
  }

  handleIconChangeToDefault () {
    const vmOs = this.props.operatingSystems.get('operatingSystems').find((v, k) => v.get('name') === this.props.vm.getIn(['os', 'type']))
    if (vmOs) {
      const iconId = vmOs.getIn(['icons', 'large', 'id'])
      this.props.onIconChangeToDefault({ iconId })
    }
  }

  render () {
    const {
      vm,
      icons,
      userMessages,
      onConsole,
      isPool,
      onConsoleOptionsSave,
      options,
      pool,
      onRDP,
      operatingSystems,
      config,
    } = this.props

    const name = isPool ? pool.get('name') : vm.get('name')
    const idPrefix = `vmdetail-${name}`
    let iconId = vm.getIn(['icons', 'large', 'id'])
    const vmsIcons = operatingSystems.get('operatingSystems').find((v, k) => v.getIn(['icons', 'large', 'id']) === iconId)
    if (vmsIcons) {
      const vmOs = operatingSystems.get('operatingSystems').find((v, k) => v.get('name') === vm.getIn(['os', 'type']))
      if (vmOs) {
        iconId = vmOs.getIn(['icons', 'large', 'id'])
      }
    }
    const icon = icons.get(iconId)
    const disks = vm.get('disks')
    const osName = getOsHumanName(vm.getIn(['os', 'type']))
    const cluster = Selectors.getClusterById(vm.getIn(['cluster', 'id']))
    const template = Selectors.getTemplateById(vm.getIn(['template', 'id']))

    const disksElement = (<VmDisks disks={disks} open={this.state.renderDisks} />)

    let optionsJS = options.hasIn(['options', 'consoleOptions', vm.get('id')]) ? options.getIn(['options', 'consoleOptions', vm.get('id')]).toJS() : {}

    const consoleOptionsShowHide = (
      <small>
        <a href='#' onClick={this.consoleSettings} id={`${idPrefix}-consoleoptions-showhide`}>
          <i className={`pficon pficon-edit`} />&nbsp;
        </a>
      </small>)

    const hasDisks = disks.size > 0
    const noDisks = hasDisks || (<small>{msg.noDisks()}</small>)

    const consolesHelp = (
      <div>
        <p id={`${idPrefix}-consolehelp-one`}>{msg.ifVmIsRunningClickToAccessItsGraphicsConsole()}</p>
        <p id={`${idPrefix}-consolehelp-two`} dangerouslySetInnerHTML={{ __html: msg.htmlPleaseReferToDocumentationForMoreInformation({ documentationUrl: AppConfiguration.consoleClientResourcesURL }) }} />
      </div>
    )

    let vmIcon = (<VmIcon
      icon={icon}
      missingIconClassName='pficon pficon-virtual-machine'
      className={sharedStyle['vm-detail-icon']}
      onIconChange={this.handleIconChange}
      onIconDefault={this.handleIconChangeToDefault}
      showEdit
      />)

    if (isPool) {
      vmIcon = <VmIcon
        icon={icon}
        missingIconClassName='pficon pficon-virtual-machine'
        className={sharedStyle['vm-detail-icon']}
        />
    }

    return (
      <div className={style['main-container']}>
        <VmsListNavigation selectedVm={vm} expanded={this.state.vmsNavigationExpanded} toggleExpansion={this.toggleVmsNavExpansion} />
        <div className={style['vm-detail-main']}>
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
                    <FieldHelp content={msg.currentlyInsertedIsoInCdRom()} text={msg.cd()} />
                  </dt>
                  <dd id={`${idPrefix}-cdrom`}>{vm.getIn(['cdrom', 'file', 'id']) ? vm.getIn(['cdrom', 'file', 'id']) : msg.empty() }</dd>
                </dl>

                <dl className={sharedStyle['vm-properties']}>
                  <dt><span className='pficon pficon-screen' />
                    &nbsp;
                    <FieldHelp content={consolesHelp} text={msg.console()} />
                    &nbsp;
                    {consoleOptionsShowHide}
                  </dt>
                  <VmConsoles vm={vm} onConsole={onConsole} onRDP={onRDP} usbFilter={config.get('usbFilter')} />
                  <ConsoleOptions smartcardOptionEnable={vm.getIn(['display', 'smartcardEnabled'])} options={optionsJS} onSave={onConsoleOptionsSave} open={this.state.openConsoleSettings} />

                  <dt><span className='fa fa-database' />
                    &nbsp;
                    <FieldHelp content={msg.storageConnectedToVm()} text={msg.disks()} />
                    &nbsp;
                  </dt>
                  {noDisks}
                  {disksElement}
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
  operatingSystems: PropTypes.object.isRequired,
  userMessages: PropTypes.object.isRequired,
  onConsole: PropTypes.func.isRequired,
  onConsoleOptionsSave: PropTypes.func.isRequired,
  onConsoleOptionsOpen: PropTypes.func.isRequired,
  options: PropTypes.object.isRequired,
  isPool: PropTypes.bool,
  config: PropTypes.object.isRequired,
  onRDP: PropTypes.func.isRequired,
  onIconChange: PropTypes.func.isRequired,
  onIconChangeToDefault: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    icons: state.icons,
    userMessages: state.userMessages,
    options: state.options,
    operatingSystems: state.operatingSystems,
  }),

  (dispatch, { vm, config }) => ({
    onConsole: ({ vmId, consoleId }) => dispatch(downloadConsole({ vmId, consoleId, usbFilter: config.get('usbFilter') })),
    onConsoleOptionsSave: ({ options }) => dispatch(saveConsoleOptions({ vmId: vm.get('id'), options })),
    onConsoleOptionsOpen: () => dispatch(getConsoleOptions({ vmId: vm.get('id') })),
    onRDP: () => dispatch(getRDP({ vmName: vm.get('name'), username: config.getIn([ 'user', 'name' ]), domain: config.get('domain'), fqdn: vm.get('fqdn') })),
    onIconChange: ({ iconBase64, mimeType }) => dispatch(changeVmIcon({ vmId: vm.get('id'), iconBase64, mimeType })),
    onIconChangeToDefault: ({ iconId }) => dispatch(changeVmIconById({ vmId: vm.get('id'), iconId })),
  })
)(VmDetail)
