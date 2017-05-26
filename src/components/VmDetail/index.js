import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'

import {
  downloadConsole,
  startPool,
  startVm,
  getConsoleOptions,
  saveConsoleOptions,
} from '../../actions'

import Time from '../Time'
import VmActions from '../VmActions'
import DetailContainer from '../DetailContainer'
import { canConsole, userFormatOfBytes, VmIcon, VmDisks, VmStatusIcon, ConsoleOptions } from 'ovirt-ui-components'
import Selectors from '../../selectors'

const LastMessage = ({ vmId, userMessages }) => {
  const vmMessages = userMessages.get('records')
    .filter(msg => (msg.failedAction && msg.failedAction.payload && msg.failedAction.payload.vmId === vmId))
    .sort((msg1, msg2) => (msg1.time - msg2.time))

  const lastMessage = vmMessages.last()

  if (!lastMessage) {
    return null
  }

  return (
    <span>
      <Time time={lastMessage.time} />
      <pre>
        {lastMessage.message}
      </pre>
    </span>
  )
}
LastMessage.propTypes = {
  vmId: PropTypes.string.isRequired,
  userMessages: PropTypes.object.isRequired,
}

const VmConsoles = ({ vm, onConsole }) => {
  return (
    <dd>
      {canConsole(vm.get('status')) ? vm.get('consoles').map(c => (
        <a
          href='#'
          data-toggle='tooltip'
          data-placement='left'
          title={`Open ${c.get('protocol').toUpperCase()} console`}
          key={c.get('id')}
          onClick={() => onConsole({ vmId: vm.get('id'), consoleId: c.get('id') })}
          className={style['left-delimiter']}
          >
          {c.get('protocol').toUpperCase()}
        </a>
      )) : ''}
    </dd>
  )
}
VmConsoles.propTypes = {
  vm: PropTypes.object.isRequired,
  onConsole: PropTypes.func.isRequired,
}

class VmDetail extends Component {
  constructor (props) {
    super(props)
    this.state = { renderDisks: true }
    this.consoleSettings = this.consoleSettings.bind(this)
  }

  consoleSettings () {
    this.props.onConsoleOptionsOpen()
    this.setState({
      openConsoleSettings: !this.state.openConsoleSettings,
    })
  }

  render () {
    const {
      vm,
      icons,
      userMessages,
      onConsole,
      isPool,
      onStartPool,
      onStartVm,
      onConsoleOptionsSave,
      options,
      pool,
    } = this.props

    let onStart = onStartVm

    if (!vm && !isPool) {
      return null
    }

    if (isPool && pool) {
      onStart = onStartPool
    }
    if (isPool && !pool) {
      return null
    }

    const name = isPool ? pool.get('name') : vm.get('name')
    const iconId = vm.getIn(['icons', 'small', 'id'])
    const icon = icons.get(iconId)
    const disks = vm.get('disks')
    const os = Selectors.getOperatingSystemByName(vm.getIn(['os', 'type']))

    const onToggleRenderDisks = () => { this.setState({ renderDisks: !this.state.renderDisks }) }
    const disksElement = this.state.renderDisks ? (<VmDisks disks={disks} />) : ''
    const hasDisks = disks.size > 0

    let optionsJS = options.hasIn(['options', 'consoleOptions', vm.get('id')]) ? options.getIn(['options', 'consoleOptions', vm.get('id')]).toJS() : {}

    const consoleOptionsIconClass = this.state.openConsoleSettings ? 'glyphicon-menu-up' : 'glyphicon-menu-down'
    const consoleOptionsShowHide = (
      <small>
        (<a href='#' onClick={this.consoleSettings}>
          <i className={`glyphicon ${consoleOptionsIconClass}`} />&nbsp;
          {this.state.openConsoleSettings ? 'hide' : 'show'}
        </a>)
      </small>)

    const disksIconClass = this.state.renderDisks ? 'glyphicon-menu-up' : 'glyphicon-menu-down'
    const disksShowHide = (
      <small>
        ({hasDisks
        ? (<a href='#' onClick={onToggleRenderDisks}>
          <i className={`glyphicon ${disksIconClass}`} />&nbsp;
          {this.state.renderDisks ? 'hide' : 'show'}
        </a>)
        : 'no disks'
      })
      </small>
    )

    return (
      <DetailContainer>
        <h1>
          <VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' className={style['vm-detail-icon']} />
          &nbsp;{name}
        </h1>
        <VmActions vm={vm} userMessages={userMessages} isPool={isPool} onStart={onStart} />
        <LastMessage vmId={vm.get('id')} userMessages={userMessages} />
        <dl className={style['vm-properties']}>
          <dt>State</dt>
          <dd><VmStatusIcon state={vm.get('status')} /> {vm.get('status')}</dd>
          <dt>Description</dt>
          <dd>{vm.get('description')}</dd>
          <dt>Operating System</dt>
          <dd>{os ? os.get('description') : vm.getIn(['os', 'type'])}</dd>
          <dt><span className='pficon pficon-memory' /> Defined Memory</dt>
          <dd>{userFormatOfBytes(vm.getIn(['memory', 'total'])).str}</dd>
          <dt><span className='pficon pficon-cpu' /> CPUs</dt>
          <dd>{vm.getIn(['cpu', 'vCPUs'])}</dd>
          <dt><span className='pficon pficon-network' /> Address</dt>
          <dd>{vm.get('fqdn')}</dd>
          <dt><span className='pficon pficon-screen' /> Console&nbsp;{consoleOptionsShowHide}</dt>
          <VmConsoles vm={vm} onConsole={onConsole} />
          <ConsoleOptions options={optionsJS} onSave={onConsoleOptionsSave} open={this.state.openConsoleSettings} />
          <dt><span className='fa fa-database' /> Disks&nbsp;{disksShowHide}</dt>
          <dd>{disksElement}</dd>
        </dl>
      </DetailContainer>
    )
  }
}
VmDetail.propTypes = {
  vm: PropTypes.object,
  pool: PropTypes.object,
  icons: PropTypes.object.isRequired,
  userMessages: PropTypes.object.isRequired,
  onConsole: PropTypes.func.isRequired,
  onConsoleOptionsSave: PropTypes.func.isRequired,
  onConsoleOptionsOpen: PropTypes.func.isRequired,
  options: PropTypes.object.isRequired,
  onStartPool: PropTypes.func.isRequired,
  onStartVm: PropTypes.func.isRequired,
  isPool: PropTypes.bool,
}

export default connect(
  (state) => ({
    icons: state.icons,
    userMessages: state.userMessages,
    options: state.options,
  }),
  (dispatch, { vm, pool }) => ({
    onConsole: ({ vmId, consoleId }) => dispatch(downloadConsole({ vmId, consoleId })),
    onConsoleOptionsSave: ({ options }) => dispatch(saveConsoleOptions({ vmId: vm.get('id'), options })),
    onConsoleOptionsOpen: () => dispatch(getConsoleOptions({ vmId: vm.get('id') })),
    onStartPool: () => dispatch(startPool({ poolId: pool.get('id') })),
    onStartVm: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(VmDetail)
