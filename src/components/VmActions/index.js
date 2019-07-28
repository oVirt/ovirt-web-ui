import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import style from './style.css'
import { msg } from '_/intl'
import { RouterPropTypeShapes } from '_/propTypeShapes'

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
  getRDP,
} from '_/actions'

import { isWindows } from '_/helpers'

import { SplitButton, Icon, Checkbox } from 'patternfly-react'
import ConfirmationModal from './ConfirmationModal'
import ConsoleConfirmationModal from './ConsoleConfirmationModal'
import Action, { ActionButtonWraper, MenuItemAction } from './Action'

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
    const { actions, id } = this.props
    let actionsCopy = [...actions]
    if (actionsCopy.length === 0) {
      return null
    }
    if (actionsCopy.length === 1) {
      actionsCopy[0].className = 'btn btn-default'
      return <ActionButtonWraper {...actionsCopy[0]} />
    }
    return (
      <Action confirmation={actionsCopy[0].confirmation}>
        <SplitButton
          bsStyle='default'
          title={actionsCopy[0].shortTitle}
          onClick={actionsCopy[0].onClick}
          id={id}
        >
          { [].concat(...actionsCopy.slice(1).map(action => {
            return action.items && action.items.length > 0
              ? action.items.filter(a => a !== null && !a.actionDisabled).map(a => <MenuItemAction key={a.shortTitle} {...a} />)
              : <MenuItemAction key={action.shortTitle} {...action} />
          }))}
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
      idPrefix = `vmaction-${vm.get('name')}`,
      config,
      onStartVm,
      onStartPool,
      onShutdown,
      onRestart,
      onForceShutdown,
      onSuspend,
      onRDP,
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

    const vncConsole = vm.get('consoles').find(c => c.get('protocol') === 'vnc')
    const hasRdp = isWindows(vm.getIn(['os', 'type']))
    const consoles = vm.get('consoles').map((c) => ({
      priority: 0,
      shortTitle: msg[c.get('protocol') + 'Console'](),
      icon: <Icon name='external-link' />,
      tooltip: msg[c.get('protocol') + 'ConsoleOpen'](),
      id: `${idPrefix}-button-console-${c.get('protocol')}`,
      confirmation: <ConsoleConfirmationModal consoleId={c.get('id')} vm={vm} />,
    })).toJS()

    if (hasRdp) {
      const domain = config.get('domain')
      const username = config.getIn([ 'user', 'name' ])
      consoles.push({
        priority: 0,
        shortTitle: msg.rdpConsole(),
        icon: <Icon name='external-link' />,
        tooltip: msg.rdpConsoleOpen(),
        id: `${idPrefix}-button-console-rdp`,
        onClick: (e) => { e.preventDefault(); onRDP({ domain, username }) },
      })
    }

    if (vncConsole) {
      consoles.push({
        priority: 0,
        shortTitle: msg.vncConsoleBrowser(),
        tooltip: msg.vncConsoleBrowserOpen(),
        actionDisabled: config.get('websocket') === null,
        id: `${idPrefix}-button-console-browser`,
        confirmation: <ConsoleConfirmationModal isNoVNC consoleId={vncConsole.get('id')} vm={vm} />,
      })
    }

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
        priority: 1,
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
        priority: 0,
        actionDisabled: isPool || !canConsole(status) || vm.getIn(['actionInProgress', 'getConsole']),
        shortTitle: msg.console(),
        tooltip: consoleProtocol,
        className: 'btn btn-default',
        bsStyle: 'default',
        id: `${idPrefix}-button-console`,
        items: consoles,
      },
    ]
    return actions
  }

  render () {
    let {
      vm,
      pool,
      isOnCard = false,
      idPrefix = `vmaction-${vm.get('name')}`,
      onRemove,
    } = this.props

    const isPool = !!pool
    const status = vm.get('status')

    const actions = this.getDefaultActions()

    idPrefix = `${idPrefix}-actions`

    // Actions for Card
    if (isOnCard) {
      let filteredActions = actions.filter((action) => !action.actionDisabled).sort((a, b) => b.priority - a.priority)
      filteredActions = filteredActions.length === 0 ? [ actions[0] ] : filteredActions

      return <div className={`actions-line card-pf-items text-center ${style['action-height']}`} id={idPrefix}>
        <VmDropdownActions id={`${idPrefix}-dropdown`} actions={filteredActions} />
      </div>
    }

    // Actions for the Toolbar
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
                  onChange={
                    () =>
                      this.setState((s) => { return { removePreserveDisks: !s.removePreserveDisks } })
                  }
                >
                  {msg.preserveDisks()}
                </Checkbox>
              </div>
            )}
          </div>
        }
        confirm={{ title: msg.yes(), onClick: () => onRemove({ preserveDisks: this.state.removePreserveDisks }) }}
      />)

    return (
      <div className={`actions-line ${style['left-padding']}`} id={idPrefix}>
        <EmptyAction state={status} isOnCard={isOnCard} />

        {actions.map(action => <ActionButtonWraper key={action.id} {...action} />)}

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
  config: PropTypes.object.isRequired,
  isOnCard: PropTypes.bool,
  isEditable: PropTypes.bool,
  idPrefix: PropTypes.string,

  location: RouterPropTypeShapes.location.isRequired,

  onShutdown: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onForceShutdown: PropTypes.func.isRequired,
  onSuspend: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onStartPool: PropTypes.func.isRequired,
  onStartVm: PropTypes.func.isRequired,
  onRDP: PropTypes.func.isRequired,
}

export default withRouter(
  connect(
    (state, { vm }) => ({
      isEditable: vm.get('canUserEditVm') && state.clusters.find(cluster => cluster.get('canUserUseCluster')) !== undefined,
      config: state.config,
    }),
    (dispatch, { vm, pool }) => ({
      onShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: false })),
      onRestart: () => dispatch(restartVm({ vmId: vm.get('id'), force: false })),
      onForceShutdown: () => dispatch(shutdownVm({ vmId: vm.get('id'), force: true })),
      onSuspend: () => dispatch(suspendVm({ vmId: vm.get('id') })),
      onRemove: ({ preserveDisks }) => dispatch(removeVm({ vmId: vm.get('id'), preserveDisks })),
      onStartPool: () => dispatch(startPool({ poolId: pool.get('id') })),
      onStartVm: () => dispatch(startVm({ vmId: vm.get('id') })),
      onRDP: ({ domain, username }) => dispatch(getRDP({ name: vm.get('name'), fqdn: vm.get('fqdn'), domain, username })),
    })
  )(VmActions)
)
