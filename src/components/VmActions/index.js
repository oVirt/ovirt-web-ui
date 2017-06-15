import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

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
  downloadConsole,
  shutdownVm,
  restartVm,
  suspendVm,
  startPool,
  startVm,
  removeVm,
} from '../../actions/index'
import { checkConsoleInUse, setConsoleInUse } from './actions'
import { hrefWithoutHistory } from '../../helpers'

import OnClickTopConfirmation from '../Confirmation/index'

class Button extends React.Component {
  constructor (props) {
    super(props)
    this.state = { toBeConfirmed: false }
  }

  render () {
    let {
      className,
      tooltip = '',
      actionDisabled = false,
      isOnCard,
      onClick,
      confirmRequired,
      shortTitle,
      button,
    } = this.props

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
        <button className={button} disabled='disabled'>
          <span data-toggle='tooltip' data-placement='left' title={tooltip}>
            {shortTitle}
          </span>
        </button>
      )
    }

    return (
      <a href='#' onClick={hrefWithoutHistory(onClick)} className={`${button} ${style['link']}`}>
        <span data-toggle='tooltip' data-placement='left' title={tooltip}>
          {shortTitle}
        </span>
      </a>
    )
  }
}
Button.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  shortTitle: PropTypes.string.isRequired,
  button: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  actionDisabled: PropTypes.bool,
  isOnCard: PropTypes.bool.isRequired,
  confirmRequired: PropTypes.object,
}

const LinkButton = ({ className, tooltip, to, actionDisabled, isOnCard, shortTitle, button }) => {
  if (actionDisabled) {
    className = `${className} ${style['action-disabled']}`
    to = undefined
  }

  if (isOnCard) {
    return (
      <div className='card-pf-item'>
        <Link to={to}>
          <span className={className} data-toggle='tooltip' data-placement='left' title={tooltip} />
        </Link>
      </div>
    )
  }

  if (actionDisabled) {
    return (
      <button className={button} disabled='disabled'>
        <span data-toggle='tooltip' data-placement='left' title={tooltip}>
          {shortTitle}
        </span>
      </button>
    )
  }

  return (
    <Link to={to} className={`${button} ${style['link']}`}>
      <span data-toggle='tooltip' data-placement='left' title={tooltip}>
        {shortTitle}
      </span>
    </Link>
  )
}

LinkButton.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  shortTitle: PropTypes.string.isRequired,
  button: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  actionDisabled: PropTypes.bool,
  isOnCard: PropTypes.bool.isRequired,
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

    if (isOnCard) {
      return null
    }

    let checkbox = null
    let height = 80

    if (isDisks) {
      checkbox = (<Checkbox checked={this.state.preserveDisks}
        onClick={() => this.setState({ preserveDisks: !this.state.preserveDisks })}
        label='Preserve disks' />)
      height = 100
    }

    const confirmRemoveText = (
      <div>
        Remove the VM?
        <br />
        {checkbox}
      </div>)

    const confirmRemove = (e) => OnClickTopConfirmation({
      id: vm.get('id'),
      target: e.target,
      confirmationText: confirmRemoveText,
      cancelLabel: 'Cancel',
      okLabel: 'Yes',
      extraButtonLabel: 'Force',
      onOk: () => onRemove({ force: false, preserveDisks: this.state.preserveDisks }),
      onExtra: () => onRemove({ force: true, preserveDisks: this.state.preserveDisks }),
      height: height,
    })

    const status = vm.get('status')
    const isDisabled = isPool || vm.getIn(['actionInProgress', 'remove']) || !canRemove(status)

    return (
      <Button isOnCard={false} actionDisabled={isDisabled}
        className='pficon pficon-remove'
        tooltip='Remove the VM'
        button='btn btn-danger'
        shortTitle='Remove'
        onClick={confirmRemove} />
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
  constructor (props) {
    super(props)
    this.state = {
      openModal: false,
      notificationTarget: null,
    }
    this.consoleConfirmationAboutToOpen = this.consoleConfirmationAboutToOpen.bind(this)
    this.onConsoleConfirmationClose = this.onConsoleConfirmationClose.bind(this)
    this.onConsoleDownload = this.onConsoleDownload.bind(this)
    this.confirmShutdown = this.confirmShutdown.bind(this)
    this.confirmRestart = this.confirmRestart.bind(this)
    this.confirmSuspend = this.confirmSuspend.bind(this)
  }

  consoleConfirmationAboutToOpen (e) {
    this.setState({
      openModal: true,
      notificationTarget: e.target,
    })
    this.props.onCheckConsoleSessionInUse()
  }

  onConsoleConfirmationClose () {
    this.setState({
      openModal: false,
      notificationTarget: null,
    })
    this.props.onConsoleSessionConfirmaClose()
  }

  onConsoleDownload () {
    this.setState({
      openModal: false,
      notificationTarget: null,
    })

    this.props.onDownloadConsole()
  }

  componentDidUpdate (prevProps, prevState) {
    if (
        this.props.VmAction.getIn(['vms', this.props.vm.get('id'), 'consoleInUse']) === true &&
        this.state.openModal === true
      ) {
      OnClickTopConfirmation({
        id: this.props.vm.get('id'),
        target: this.state.notificationTarget,
        confirmationText: 'Console in use, continue?',
        cancelLabel: 'Cancel',
        okLabel: 'Yes',
        onOk: this.onConsoleDownload,
        onCancel: this.onConsoleConfirmationClose,
      })
    }
  }

  confirmShutdown (e) {
    OnClickTopConfirmation({
      id: this.props.vm.get('id'),
      target: e.target,
      confirmationText: 'Shut down the VM?',
      cancelLabel: 'Cancel',
      okLabel: 'Yes',
      extraButtonLabel: 'Force',
      onOk: this.props.onShutdown,
      onExtra: this.props.onForceShutdown,
    })
  }

  confirmRestart (e) {
    return OnClickTopConfirmation({
      id: this.props.vm.get('id'),
      target: e.target,
      confirmationText: 'Restart the VM?',
      cancelLabel: 'Cancel',
      okLabel: 'Yes',
      onOk: this.props.onRestart,
    })
  }

  confirmSuspend (e) {
    return OnClickTopConfirmation({
      id: this.props.vm.get('id'),
      target: e.target,
      confirmationText: 'Suspend the VM?',
      cancelLabel: 'Cancel',
      okLabel: 'Yes',
      onOk: this.props.onSuspend,
    })
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
      consoleProtocol = `Open ${protocol} Console`
    }

    if (vm.get('consoleInUse')) {
      consoleProtocol = 'Console in use'
    }

    return (
      <div className={`actions-line ${isOnCard ? 'card-pf-items text-center' : style['left-padding']}`}>
        <EmptyAction state={status} isOnCard={isOnCard} />

        <Button isOnCard={isOnCard} actionDisabled={(!isPool && !canStart(status)) || vm.getIn(['actionInProgress', 'start'])}
          shortTitle='Start'
          button='btn btn-success'
          className='fa fa-play'
          tooltip='Start the VM'
          onClick={onStart} />

        <Button isOnCard={isOnCard} actionDisabled={isPool || !canSuspend(status) || vm.getIn(['actionInProgress', 'suspend'])}
          shortTitle='Suspend'
          button='btn btn-default'
          className='fa fa-pause'
          tooltip='Suspend the VM'
          onClick={this.confirmSuspend} />

        <Button isOnCard={isOnCard} actionDisabled={isPool || !canShutdown(status) || vm.getIn(['actionInProgress', 'shutdown'])}
          className='fa fa-power-off'
          button='btn btn-danger'
          tooltip='Shut down the VM'
          shortTitle='Shut down'
          onClick={this.confirmShutdown} />

        <Button isOnCard={isOnCard} actionDisabled={isPool || !canRestart(status) || vm.getIn(['actionInProgress', 'restart'])}
          className='pficon pficon-restart'
          button='btn btn-default'
          tooltip='Reboot the VM'
          shortTitle='Reboot'
          onClick={this.confirmRestart} />

        <Button isOnCard={isOnCard} actionDisabled={isPool || !canConsole(status) || vm.getIn(['actionInProgress', 'getConsole'])}
          button='btn btn-default'
          className='pficon pficon-screen'
          tooltip={consoleProtocol}
          shortTitle='Console'
          onClick={this.consoleConfirmationAboutToOpen} />

        <LinkButton isOnCard={isOnCard}
          shortTitle='Edit'
          button='btn btn-primary'
          className={`pficon pficon-edit ${style['action-link']}`}
          tooltip='Edit the VM' to={`/vm/${vm.get('id')}/edit`} />

        <RemoveVmAction isOnCard={isOnCard} isPool={isPool} vm={vm} isDisks={vm.get('disks').size > 0} onRemove={onRemove} />
      </div>
    )
  }
}

VmActions.propTypes = {
  vm: PropTypes.object.isRequired,
  VmAction: PropTypes.object.isRequired,
  isOnCard: PropTypes.bool,
  isPool: PropTypes.bool,
  pool: PropTypes.object,
  onDownloadConsole: PropTypes.func.isRequired,
  onConsoleSessionConfirmaClose: PropTypes.func.isRequired,
  onCheckConsoleSessionInUse: PropTypes.func.isRequired,
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
    VmAction: state.VmAction,
  }),
  (dispatch, { vm, pool }) => ({
    onCheckConsoleSessionInUse: () => dispatch(checkConsoleInUse({ vmId: vm.get('id') })),
    onConsoleSessionConfirmaClose: () => dispatch(setConsoleInUse({ vmId: vm.get('id'), consoleInUse: false })),
    onDownloadConsole: () => dispatch(downloadConsole({ vmId: vm.get('id') })),
    onShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: false })),
    onRestart: () => dispatch(restartVm({ vmId: vm.get('id'), force: false })),
    onForceShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: true })),
    onSuspend: () => dispatch(suspendVm({ vmId: vm.get('id') })),
    onRemove: ({ preserveDisks, force }) => dispatch(removeVm({ vmId: vm.get('id'), force, preserveDisks })),
    onStartPool: () => dispatch(startPool({ poolId: pool.get('id') })),
    onStartVm: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(VmActions)
