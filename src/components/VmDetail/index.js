import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './style.css'

import {
  getConsole,
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
        <a href='#' key={c.get('id')} onClick={() => onConsole({ vmId: vm.get('id'), consoleId: c.get('id') })} className={style['left-delimiter']}>
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
    const iconClass = this.state.openConsoleSettings ? 'glyphicon-menu-up' : 'glyphicon-menu-down'
    const text = this.state.openConsoleSettings ? 'Hide' : 'Show'

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
          <dt><span className='pficon pficon-screen' /> Console
            <a href='#' onClick={this.consoleSettings} className={style['options-btn']}><i className={`glyphicon ${iconClass}`} />{text}</a>
          </dt>
          <VmConsoles vm={vm} onConsole={onConsole} />
          <ConsoleOptions options={optionsJS} onSave={onConsoleOptionsSave} open={this.state.openConsoleSettings} />
          <dt><span className='fa fa-database' /> Disks&nbsp;
            <small>
              ({hasDisks
                ? (<a href='#' onClick={onToggleRenderDisks}>{this.state.renderDisks ? 'hide' : 'show'}</a>)
                : 'no disks'
              })
            </small>
          </dt>
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
    onConsole: ({ vmId, consoleId }) => dispatch(getConsole({ vmId, consoleId })),
    onConsoleOptionsSave: ({ options }) => dispatch(saveConsoleOptions({ vmId: vm.get('id'), options })),
    onConsoleOptionsOpen: () => dispatch(getConsoleOptions({ vmId: vm.get('id') })),
    onStartPool: () => dispatch(startPool({ poolId: pool.get('id') })),
    onStartVm: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(VmDetail)
