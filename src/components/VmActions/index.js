import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'
import { msg } from '../../intl'

import {
  canRestart,
  canShutdown,
  canStart,
  canConsole,
  canSuspend,
  canRemove,
} from '../../vm-status'

import {
  shutdownVm,
  restartVm,
  suspendVm,
  startPool,
  startVm,
  removeVm,
} from '../../actions/index'

import Button from './Button'
import Checkbox from '../Checkbox'
import Confirmation from '../Confirmation'
import ConsoleButton from './ConsoleButton'
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
 * Set of actions for a single VM or Pool, either on a single VM card or on the VM
 * edit page.  The availability of actions depends on the VM state and the `isOnCard`
 * location of the VmActions component.
 */
class VmActions extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
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
      config,
    } = this.props

    const isPool = !!pool
    const isPoolVm = vm.getIn(['pool', 'id'], false) // a Pool VM is different the a Pool (definition)
    const onStart = (isPool ? onStartPool : onStartVm)
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
          actionDisabled={isPool || isPoolVm || !canSuspend(status) || vm.getIn(['actionInProgress', 'suspend'])}
          shortTitle={msg.suspend()}
          tooltip={msg.suspendVm()}
          button='btn btn-default'
          className='fa fa-moon-o'
          id={`${idPrefix}-button-suspend`}
          popover={({ close }) =>
            <Confirmation
              text={msg.suspendVmQuestion()}
              okButton={{ label: msg.yes(), click: () => { this.props.onSuspend(); close() } }}
              cancelButton={{ label: msg.cancel(), click: () => close() }}
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
              text={msg.shutdownVmQuestion()}
              okButton={{ label: msg.yes(), click: () => { this.props.onShutdown(); close() } }}
              cancelButton={{ label: msg.cancel(), click: () => close() }}
              extraButton={{ label: msg.force(), click: () => { this.props.onForceShutdown(); close() } }}
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
              okButton={{ label: msg.yes(), click: () => { this.props.onRestart(); close() } }}
              cancelButton={{ label: msg.cancel(), click: () => close() }}
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
                okButton={{ label: msg.yes(), click: () => { this.props.onRemove({ force: false, preserveDisks: this.state.removePreserveDisks }); close() } }}
                cancelButton={{ label: msg.cancel(), click: () => close() }}
                extraButton={{ label: msg.force(), click: () => { this.props.onRemove({ force: true, preserveDisks: this.state.removePreserveDisks }); close() } }}
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
  pool: PropTypes.object,
  isOnCard: PropTypes.bool,
  config: PropTypes.object.isRequired,
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
