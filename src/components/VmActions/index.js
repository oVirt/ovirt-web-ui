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

import Confirmation from '../Confirmation'
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

/**
 * Active actions on a single VM-card.
 * List of actions depends on the VM state.
 */
class VmActions extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      forceShutdown: false,
      removePreserveDisks: false,
    }
  }

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
      const vConsole = vm.get('consoles').find(c => c.get('protocol') === 'spice') || vm.getIn(['consoles', 0])
      const protocol = vConsole.get('protocol').toUpperCase()
      consoleProtocol = msg.openProtocolConsole({ protocol })
    }

    if (vm.get('consoleInUse')) {
      consoleProtocol = 'Console in use'
    }

    const handleSuspend = (close) => () => {
      this.props.onSuspend()
      close()
    }

    const idPrefix = `vmaction-${vm.get('name')}`
    return (
      <div className={`actions-line ${isOnCard ? 'card-pf-items text-center' : style['left-padding']}`}>
        <EmptyAction state={status} isOnCard={isOnCard} />

        <Button isOnCard={isOnCard}
          actionDisabled={(!isPool && !canStart(status)) || vm.getIn(['actionInProgress', 'start'])}
          shortTitle={msg.run()}
          tooltip={msg.startVm()}
          button='btn btn-success'
          className='fa fa-play'
          id={`${idPrefix}-button-start`}
          onClick={onStart} />

        <Button isOnCard={isOnCard}
          actionDisabled={isPool || !canSuspend(status) || vm.getIn(['actionInProgress', 'suspend'])}
          shortTitle={msg.suspend()}
          tooltip={msg.suspendVm()}
          button='btn btn-default'
          className='fa fa-moon-o'
          id={`${idPrefix}-button-suspend`}
          popover={({ close }) =>
            <Confirmation
              text={msg.suspendVmQuestion()}
              okButton={{ label: msg.yes(), click: handleSuspend(close) }}
              cancelButton={{ label: msg.cancel(), click: () => { close() } }}
              uniqueId={vm.get('name')} />}
        />

        <Button isOnCard={isOnCard}
          actionDisabled={isPool || !canShutdown(status) || vm.getIn(['actionInProgress', 'shutdown'])}
          shortTitle={msg.shutdown()}
          tooltip={msg.shutdownVm()}
          button='btn btn-danger'
          className='fa fa-power-off'
          id={`${idPrefix}-button-shutdown`}
          popover={({ close }) =>
            <Confirmation
              text={(
                <div>
                  <div>{msg.shutdownVmQuestion()}</div>
                  <div style={{ marginTop: '8px' }}>
                    <Checkbox
                      checked={this.state.forceShutdown}
                      onClick={() => { this.setState((s) => { return { forceShutdown: !s.forceShutdown } }) }}
                      label={msg.force()}
                    />
                  </div>
                </div>
              )}
              okButton={{ label: msg.yes(), click: () => { this.state.forceShutdown ? this.props.onForceShutdown() : this.props.onShutdown() } }}
              cancelButton={{ label: msg.cancel(), click: () => { close() } }}
              uniqueId={vm.get('name')} />}
        />

        <Button isOnCard={isOnCard}
          actionDisabled={isPool || !canRestart(status) || vm.getIn(['actionInProgress', 'restart'])}
          shortTitle={msg.reboot()}
          tooltip={msg.rebootVm()}
          button='btn btn-default'
          className='pficon pficon-restart'
          id={`${idPrefix}-button-reboot`}
          popover={({ close }) =>
            <Confirmation
              text={msg.rebootVmQuestion()}
              okButton={{ label: msg.yes(), click: this.props.onRestart }}
              cancelButton={{ label: msg.cancel(), click: () => { close() } }}
              uniqueId={vm.get('name')} />}
        />

        <ConsoleButton isOnCard={isOnCard}
          actionDisabled={isPool || !canConsole(status) || vm.getIn(['actionInProgress', 'getConsole'])}
          shortTitle={msg.console()}
          tooltip={consoleProtocol}
          button='btn btn-default'
          className='pficon pficon-screen'
          vm={vm}
          usbFilter={config.get('usbFilter')}
          userId={config.getIn(['user', 'id'])} />

        <span className={style['button-spacer']} />

        <LinkButton isOnCard={isOnCard}
          shortTitle={msg.edit()}
          tooltip={msg.editVm()} to={`/vm/${vm.get('id')}/edit`}
          button='btn btn-default'
          className={`pficon pficon-edit ${style['action-link']}`}
          id={`action-${vm.get('name')}-edit`} />

        {!isOnCard && (
          <Button isOnCard={false}
            actionDisabled={isPool || !canRemove(status) || vm.getIn(['actionInProgress', 'remove'])}
            shortTitle={msg.remove()}
            tooltip={msg.removeVm()}
            button='btn btn-danger'
            className='pficon pficon-remove'
            id={`${idPrefix}-button-remove`}
            popover={({ close }) =>
              <Confirmation
                text={(
                  <div>
                    <div id={`${idPrefix}-question`}>{msg.removeVmQustion()}</div>
                    {vm.get('disks').size > 0 && (
                      <div style={{ marginTop: '8px' }} id={`${idPrefix}-preservedisks`}>
                        <Checkbox
                          checked={this.state.removePreserveDisks}
                          onClick={() => this.setState((s) => { return { removePreserveDisks: !s.removePreserveDisks } })}
                          label={msg.preserveDisks()} />
                      </div>
                    )}
                  </div>
                )}
                okButton={{ label: msg.yes(), click: () => onRemove({ force: false, preserveDisks: this.state.removePreserveDisks }) }}
                cancelButton={{ label: msg.cancel(), click: () => { close() } }}
                extraButton={{ label: msg.force(), click: () => onRemove({ force: true, preserveDisks: this.state.removePreserveDisks }) }}
                uniqueId={vm.get('name')}
              />}
          />
        )}
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
