import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { msg } from '../../intl'

import style from './style.css'

import {
  Checkbox,
  canRestart,
  canShutdown,
  canStart,
  canConsole,
  canSuspend,
  canRemove,
} from 'ovirt-ui-components'

import {
  shutdownVm,
  restartVm,
  suspendVm,
  startPool,
  startVm,
  removeVm,
} from '../../actions/index'

import Confirmation from '../Confirmation/index'
import ConsoleButton from './ConsoleButton'
import Button from './Button'
import LinkButton from './LinkButton'

const EmptyAction = ({ state, isOnCard }) => {
  if (!canConsole(state) && !canShutdown(state) && !canRestart(state) && !canStart(state)) {
    return (
      <div className={isOnCard ? 'card-pf-item' : undefined} />
    )
  }
  return null
}
EmptyAction.propTypes = {
  state: PropTypes.string,
  isOnCard: PropTypes.bool.isRequired,
}

class RemoveVmAction extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      preserveDisks: false,
    }
  }

  render () {
    const { isOnCard, isPool, vm, onRemove, isDisks } = this.props
    const idPrefix = `removeaction-${vm.get('name')}`

    if (isOnCard) {
      return null
    }

    let checkbox = null
    let height = null

    if (isDisks) {
      checkbox = (
        <div style={{ marginTop: '8px' }} id={`${idPrefix}-preservedisks`}>
          <Checkbox
            checked={this.state.preserveDisks}
            onClick={() => this.setState({ preserveDisks: !this.state.preserveDisks })}
            label={msg.preserveDisks()} />
        </div>)
      height = 75
    }
    let confirmRemoveText = null
    if (checkbox) {
      confirmRemoveText = (
        <div id={`${idPrefix}-question`}>
          {msg.removeVmQustion()}
          <br />
          {checkbox}
        </div>)
    } else {
      confirmRemoveText = msg.removeVmQustion()
    }

    const status = vm.get('status')
    const isDisabled = isPool || vm.getIn(['actionInProgress', 'remove']) || !canRemove(status)

    return (
      <Button isOnCard={false} actionDisabled={isDisabled}
        className='pficon pficon-remove'
        tooltip={msg.removeVm()}
        button='btn btn-danger'
        shortTitle={msg.remove()}
        id={`${idPrefix}-button-remove`}
        popover={({ close }) => <Confirmation
          height={height}
          text={confirmRemoveText}
          okButton={{ label: msg.yes(), click: () => onRemove({ force: false, preserveDisks: this.state.preserveDisks }) }}
          cancelButton={{ label: msg.cancel(), click: () => { close() } }}
          extraButton={{ label: msg.force(), click: () => onRemove({ force: true, preserveDisks: this.state.preserveDisks }) }}
          uniqueId={vm.get('name')}
        />}
      />
    )
  }
}
RemoveVmAction.propTypes = {
  vm: PropTypes.object.isRequired,
  isOnCard: PropTypes.bool,
  isPool: PropTypes.bool,
  onRemove: PropTypes.func.isRequired,
  isDisks: PropTypes.bool,
}

/**
 * Active actions on a single VM-card.
 * List of actions depends on the VM state.
 */
class VmActions extends React.Component {
  render () {
    let {
      vm,
      pool,
      isOnCard = false,
      onStartVm,
      onStartPool,
      isPool,
      onRemove,
      config,
    } = this.props

    let onStart = onStartVm
    if (isPool && pool) {
      onStart = onStartPool
    }
    if (isPool && !pool) {
      return null
    }

    const status = vm.get('status')

    let consoleProtocol = ''
    if (!vm.get('consoles').isEmpty()) {
      const vConsole = vm.get('consoles').find(c => c.get('protocol') === 'spice') ||
        vm.getIn(['consoles', 0])
      const protocol = vConsole.get('protocol').toUpperCase()
      consoleProtocol = msg.openProtocolConsole({ protocol })
    }

    if (vm.get('consoleInUse')) {
      consoleProtocol = 'Console in use'
    }

    const idPrefix = `vmaction-${vm.get('name')}`
    return (
      <div className={`actions-line ${isOnCard ? 'card-pf-items text-center' : style['left-padding']}`}>
        <EmptyAction state={status} isOnCard={isOnCard} />

        <Button isOnCard={isOnCard} actionDisabled={(!isPool && !canStart(status)) || vm.getIn(['actionInProgress', 'start'])}
          shortTitle={msg.run()}
          button='btn btn-success'
          className='fa fa-play'
          tooltip={msg.startVm()}
          onClick={onStart}
          id={`${idPrefix}-button-start`} />

        <Button isOnCard={isOnCard} actionDisabled={isPool || !canSuspend(status) || vm.getIn(['actionInProgress', 'suspend'])}
          shortTitle={msg.suspend()}
          button='btn btn-default'
          className='fa fa-moon-o'
          tooltip={msg.suspendVm()}
          id={`${idPrefix}-button-suspend`}
          popover={({ close }) => <Confirmation text={msg.suspendVmQuestion()}
            okButton={{ label: msg.yes(), click: this.props.onSuspend }}
            cancelButton={{ label: msg.cancel(), click: () => { close() } }}
            uniqueId={vm.get('name')} />} />

        <Button isOnCard={isOnCard} actionDisabled={isPool || !canShutdown(status) || vm.getIn(['actionInProgress', 'shutdown'])}
          className='fa fa-power-off'
          button='btn btn-danger'
          tooltip={msg.shutdownVm()}
          shortTitle={msg.shutdown()}
          id={`${idPrefix}-button-shutdown`}
          popover={({ close }) => <Confirmation text={msg.shutdownVmQuestion()}
            okButton={{ label: msg.yes(), click: this.props.onShutdown }}
            cancelButton={{ label: msg.cancel(), click: () => { close() } }}
            uniqueId={vm.get('name')} />} />

        <Button isOnCard={isOnCard} actionDisabled={isPool || !canRestart(status) || vm.getIn(['actionInProgress', 'restart'])}
          className='pficon pficon-restart'
          button='btn btn-default'
          tooltip={msg.rebootVm()}
          shortTitle={msg.reboot()}
          id={`${idPrefix}-button-reboot`}
          popover={({ close }) => <Confirmation text={msg.rebootVmQuestion()}
            okButton={{ label: msg.yes(), click: this.props.onRestart }}
            cancelButton={{ label: msg.cancel(), click: () => { close() } }}
            uniqueId={vm.get('name')} />} />

        <ConsoleButton isOnCard={isOnCard} actionDisabled={isPool || !canConsole(status) || vm.getIn(['actionInProgress', 'getConsole'])}
          button='btn btn-default'
          className='pficon pficon-screen'
          tooltip={consoleProtocol}
          shortTitle={msg.console()}
          usbFilter={config.get('usbFilter')}
          vm={vm}
          userId={config.getIn(['user', 'id'])} />

        <span className={style['button-spacer']} />

        <LinkButton isOnCard={isOnCard}
          shortTitle={msg.edit()}
          button='btn btn-default'
          className={`pficon pficon-edit ${style['action-link']}`}
          tooltip={msg.editVm()} to={`/vm/${vm.get('id')}/edit`}
          id={`action-${vm.get('name')}-edit`} />

        <RemoveVmAction isOnCard={isOnCard} isPool={isPool} vm={vm} isDisks={vm.get('disks').size > 0} onRemove={onRemove} />
      </div>
    )
  }
}

VmActions.propTypes = {
  vm: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  isOnCard: PropTypes.bool,
  isPool: PropTypes.bool,
  pool: PropTypes.object,
  onShutdown: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onForceShutdown: PropTypes.func.isRequired,
  onSuspend: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onStartPool: PropTypes.func.isRequired,
  onStartVm: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    icons: state.icons,
    config: state.config,
  }),
  (dispatch, { vm, pool }) => ({
    onShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: false })),
    onRestart: () => dispatch(restartVm({ vmId: vm.get('id'), force: false })),
    onForceShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: true })),
    onSuspend: () => dispatch(suspendVm({ vmId: vm.get('id') })),
    onRemove: ({ preserveDisks, force }) => dispatch(removeVm({ vmId: vm.get('id'), force, preserveDisks })),
    onStartPool: () => dispatch(startPool({ poolId: pool.get('id') })),
    onStartVm: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(VmActions)
