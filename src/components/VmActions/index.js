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
} from '../../actions'

import { SplitButton, MenuItem } from 'patternfly-react'
import Checkbox from '../Checkbox'
import LinkButton from './LinkButton'
import ConfirmationModal from './ConfirmationModal'
import ConsoleConfirmationModal from './ConsoleConfirmationModal'
import Action, { ActionButtonWraper } from './Action'

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

class VmDropdownActions extends React.Component {
  render () {
    let { actions, id } = this.props
    if (actions.length === 0) {
      return null
    }
    if (actions.length === 1) {
      actions[0].className = 'btn btn-default'
      return <ActionButtonWraper {...actions[0]} />
    }
    return (
      <Action confirmation={actions[0].confirmation}>
        <SplitButton
          bsStyle='default'
          title={actions[0].shortTitle}
          onClick={actions[0].onClick}
          id={id}
        >
          { actions.slice(1).map(action => <Action key={action.shortTitle} confirmation={action.confirmation}>
            <MenuItem onClick={action.onClick}>
              {action.shortTitle}
            </MenuItem>
          </Action>) }
        </SplitButton>
      </Action>
    )
  }
}

VmDropdownActions.propTypes = {
  actions: PropTypes.array.isRequired,
  id: PropTypes.string.isRequired,
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

    this.getDefaultActions = this.getDefaultActions.bind(this)
  }

  /**
   * Compose main actions that appear in Card and Toolbar
   */
  getDefaultActions () {
    let {
      vm,
      pool,
      onStartVm,
      onStartPool,
      onShutdown,
      onRestart,
      onForceShutdown,
      onSuspend,
    } = this.props
    const isPool = !!pool
    const status = vm.get('status')
    const isPoolVm = !!vm.getIn(['pool', 'id'], false)
    const onStart = (isPool ? onStartPool : onStartVm)

    // TODO: On the card list page, the VM's consoles would not have been fetched yet,
    // TODO: so the tooltip on the console button will be blank.
    let consoleProtocol = ''
    if (!vm.get('consoles').isEmpty()) {
      const vConsole = vm.get('consoles').find(c => c.get('protocol') === 'spice') || vm.getIn(['consoles', 0])
      const protocol = vConsole.get('protocol').toUpperCase()
      consoleProtocol = msg.openProtocolConsole({ protocol })
    }

    if (vm.get('consoleInUse')) {
      consoleProtocol = 'Console in use'
    }

    const suspendConfirmation = (<ConfirmationModal title={msg.suspendVm()} body={msg.suspendVmQuestion()}
      confirm={{ title: msg.yes(), onClick: () => onSuspend() }} />)
    const shutdownConfirmation = (<ConfirmationModal accessibleDescription='one' title={msg.shutdownVm()} body={msg.shutdownVmQuestion()}
      confirm={{ title: msg.yes(), onClick: () => onShutdown() }}
      extra={{ title: msg.force(), onClick: () => onForceShutdown() }} />)
    const rebootConfirmation = (<ConfirmationModal title={msg.rebootVm()} body={msg.rebootVmQuestion()}
      confirm={{ title: msg.yes(), onClick: () => onRestart() }} />)
    const consoleConfirmation = (<ConsoleConfirmationModal vm={vm} />)

    const idPrefix = `vmaction-${vm.get('name')}`
    const actions = [
      {
        priority: 0,
        actionDisabled: (!isPool && !canStart(status)) || vm.getIn(['actionInProgress', 'start']),
        shortTitle: msg.run(),
        tooltip: msg.startVm(),
        className: 'btn btn-success',
        id: `${idPrefix}-button-start`,
        onClick: onStart,
      },
      {
        priority: 0,
        actionDisabled: isPool || isPoolVm || !canSuspend(status) || vm.getIn(['actionInProgress', 'suspend']),
        shortTitle: msg.suspend(),
        tooltip: msg.suspendVm(),
        className: 'btn btn-default',
        id: `${idPrefix}-button-suspend`,
        confirmation: suspendConfirmation,
      },
      {
        priority: 0,
        actionDisabled: isPool || !canShutdown(status) || vm.getIn(['actionInProgress', 'shutdown']),
        shortTitle: msg.shutdown(),
        tooltip: msg.shutdownVm(),
        className: 'btn btn-danger',
        id: `${idPrefix}-button-shutdown`,
        confirmation: shutdownConfirmation,
      },
      {
        priority: 0,
        actionDisabled: isPool || !canRestart(status) || vm.getIn(['actionInProgress', 'restart']),
        shortTitle: msg.reboot(),
        tooltip: msg.rebootVm(),
        className: 'btn btn-default',
        id: `${idPrefix}-button-reboot`,
        confirmation: rebootConfirmation,
      },
      {
        priority: 1,
        actionDisabled: isPool || !canConsole(status) || vm.getIn(['actionInProgress', 'getConsole']),
        shortTitle: msg.console(),
        tooltip: consoleProtocol,
        className: 'btn btn-default',
        id: `${idPrefix}-button-console`,
        confirmation: consoleConfirmation,
      },
    ]
    return actions
  }

  render () {
    let {
      vm,
      pool,
      isOnCard = false,
      onRemove,
    } = this.props

    const isPool = !!pool
    const status = vm.get('status')

    const idPrefix = `vmaction-${vm.get('name')}`
    const actions = this.getDefaultActions()

    // Actions for Card
    if (isOnCard) {
      let filteredActions = actions.filter((action) => !action.actionDisabled).sort((a, b) => a.priority < b.priority ? 1 : 0)
      filteredActions = filteredActions.length === 0 ? [ actions[0] ] : filteredActions
      console.log(filteredActions)
      return <div className={`actions-line card-pf-items text-center ${style['action-height']}`}><VmDropdownActions id={`${idPrefix}-actions`} actions={filteredActions} /></div>
    }

    // Actions for toolbars
    const removeConfirmation = (
      <ConfirmationModal
        title={msg.remove()}
        body={
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
        }
        confirm={{ title: msg.yes(), onClick: () => onRemove({ force: false, preserveDisks: this.state.removePreserveDisks }) }}
        extra={{ title: msg.force(), onClick: () => onRemove({ force: true, preserveDisks: this.state.removePreserveDisks }) }}
      />)

    return (
      <div className={`actions-line ${style['left-padding']}`}>
        <EmptyAction state={status} isOnCard={isOnCard} />

        {actions.map(action => <ActionButtonWraper {...action} />)}

        <span className={style['button-spacer']} />

        <LinkButton isOnCard={isOnCard}
          shortTitle={msg.edit()}
          tooltip={msg.editVm()} to={`/vm/${vm.get('id')}/edit`}
          button='btn btn-default'
          className={`pficon pficon-edit ${style['action-link']}`}
          id={`action-${vm.get('name')}-edit`} />
        <ActionButtonWraper
          confirmation={removeConfirmation}
          actionDisabled={isPool || !canRemove(status) || vm.getIn(['actionInProgress', 'remove'])}
          shortTitle={msg.remove()}
          tooltip={msg.removeVm()}
          className='btn btn-danger'
          id={`${idPrefix}-button-remove`}
        />
      </div>
    )
  }
}
VmActions.propTypes = {
  vm: PropTypes.object.isRequired,
  pool: PropTypes.object,
  isOnCard: PropTypes.bool,

  onShutdown: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onForceShutdown: PropTypes.func.isRequired,
  onSuspend: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onStartPool: PropTypes.func.isRequired,
  onStartVm: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({ }),
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
