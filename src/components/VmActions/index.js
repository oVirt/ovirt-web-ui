import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './style.css'

import { canRestart, canShutdown, canStart, canConsole, canSuspend } from 'ovirt-ui-components'
import { getConsole, shutdownVm, restartVm, suspendVm, startVm, showEditVm } from '../../actions/vm'

import OnClickTopConfirmation from '../Confirmation'

class Button extends React.Component {
  constructor (props) {
    super(props)
    this.state = { toBeConfirmed: false }
  }

  render () {
    let { className, tooltip = '', actionDisabled = false, isOnCard, onClick, confirmRequired } = this.props

    const toggleConfirm = () => {
      this.setState({ toBeConfirmed: !this.state.toBeConfirmed })
    }

    if (confirmRequired && this.state.toBeConfirmed) {
      return (
        <span className={isOnCard ? 'card-pf-item' : style['left-delimiter']}>
          <button className='btn btn-danger btn-xs' type='button' onClick={() => { toggleConfirm(); onClick() }}>
            {confirmRequired.confirmText}
          </button>
          &nbsp;
          <button className='btn btn-primary btn-xs' type='button' onClick={toggleConfirm}>
            {confirmRequired.cancelText}
          </button>
        </span>
      )
    } else if (confirmRequired) {
      onClick = toggleConfirm
    }

    if (actionDisabled) {
      className = `${className} ${style['action-disabled']}`
      onClick = undefined
    }

    if (isOnCard) {
      return (
        <div className='card-pf-item'>
          <span className={className} data-toggle='tooltip' data-placement='left' title={tooltip} onClick={onClick} />
        </div>
      )
    }

    if (actionDisabled) {
      return (
        <span className={style['left-delimiter']}>
          <span className={className} data-toggle='tooltip' data-placement='left' title={tooltip} />
        </span>
      )
    }

    return (
      <a href='#' onClick={onClick} className={style['left-delimiter']}>
        <span className={className} data-toggle='tooltip' data-placement='left' title={tooltip} />
      </a>
    )
  }
}
Button.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  onClick: PropTypes.func,
  actionDisabled: PropTypes.bool,
  isOnCard: PropTypes.bool.isRequired,
  confirmRequired: PropTypes.object,
}

const EmptyAction = ({ state, isOnCard }) => {
  if (!canConsole(state) && !canShutdown(state) && !canRestart(state) && !canStart(state)) {
    return (
      <div className={isOnCard ? 'card-pf-item' : undefined} />
    )
  }
  return null
}
EmptyAction.propTypes = {
  state: PropTypes.string.isRequired,
  isOnCard: PropTypes.bool.isRequired,
}

/**
 * Active actions on a single VM-card.
 * List of actions depends on the VM state.
 */
const VmActions = ({
  vm,
  isOnCard = false,
  onGetConsole,
  onShutdown,
  onRestart,
  onStart,
  onSuspend,
  onEdit,
}) => {
  const status = vm.get('status')

  const confirmShutdown = (e) => OnClickTopConfirmation({
    id: vm.get('id'),
    target: e.target,
    confirmationText: 'Shut down the VM?',
    cancelLabel: 'Cancel',
    okLabel: 'Yes',
    extraButtonLabel: 'Force',
    onOk: onShutdown,
    onExtra: onForceShutdown,
  })

  const confirmRestart = (e) => OnClickTopConfirmation({
    id: vm.get('id'),
    target: e.target,
    confirmationText: 'Restart the VM?',
    cancelLabel: 'Cancel',
    okLabel: 'Yes',
    onOk: onRestart,
  })

  const confirmSuspend = (e) => OnClickTopConfirmation({
    id: vm.get('id'),
    target: e.target,
    confirmationText: 'Suspend the VM?',
    cancelLabel: 'Cancel',
    okLabel: 'Yes',
    onOk: onSuspend,
  })

  let consoleProtocol = ''
  if (!vm.get('consoles').isEmpty()) {
    const vConsole = vm.get('consoles').find(c => c.get('protocol') === 'spice') ||
      vm.getIn(['consoles', 0])
    const protocol = vConsole.get('protocol').toUpperCase()
    consoleProtocol = `Open ${protocol} Console`
  }

  return (
    <div className={isOnCard ? 'card-pf-items text-center' : style['left-padding']}>
      <EmptyAction state={status} isOnCard={isOnCard} />
      <Button isOnCard={isOnCard} actionDisabled={!canConsole(status) || vm.getIn(['actionInProgress', 'getConsole'])}
        className='pficon pficon-screen' tooltip={consoleProtocol} onClick={onGetConsole} />

      <Button isOnCard={isOnCard} actionDisabled={!canShutdown(status) || vm.getIn(['actionInProgress', 'shutdown'])}
        className='fa fa-power-off'
        tooltip='Shut down the VM'
        onClick={confirmShutdown} />

      <Button isOnCard={isOnCard} actionDisabled={!canRestart(status) || vm.getIn(['actionInProgress', 'restart'])}
        className='pficon pficon-restart'
        tooltip='Reboot the VM'
        onClick={confirmRestart} />

      <Button isOnCard={isOnCard} actionDisabled={!canStart(status) || vm.getIn(['actionInProgress', 'start'])}
        className='fa fa-play' tooltip='Start the VM' onClick={onStart} />

      <Button isOnCard={isOnCard} actionDisabled={!canSuspend(status) || vm.getIn(['actionInProgress', 'suspend'])}
        className='fa fa-pause'
        tooltip='Suspend the VM'
        onClick={confirmSuspend} />

      <Button isOnCard={isOnCard}
        className='pficon pficon-edit' tooltip='Edit the VM' onClick={onEdit} />
    </div>
  )
}
VmActions.propTypes = {
  vm: PropTypes.object.isRequired,
  isOnCard: PropTypes.bool,
  onGetConsole: PropTypes.func.isRequired,
  onShutdown: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onForceShutdown: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onSuspend: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    icons: state.icons,
  }),
  (dispatch, { vm }) => ({
    onGetConsole: () => dispatch(getConsole({ vmId: vm.get('id') })),
    onShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: false })),
    onRestart: () => dispatch(restartVm({ vmId: vm.get('id'), force: false })),
    onForceShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: true })),
    onStart: () => dispatch(startVm({ vmId: vm.get('id') })),
    onSuspend: () => dispatch(suspendVm({ vmId: vm.get('id') })),
    onEdit: () => dispatch(showEditVm({ vm: vm })),
  })
)(VmActions)
