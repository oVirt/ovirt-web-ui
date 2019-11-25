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

import { SplitButton, Icon, Checkbox, DropdownKebab } from 'patternfly-react'
import ConfirmationModal from './ConfirmationModal'
import ConsoleConfirmationModal from './ConsoleConfirmationModal'
import Action, { ActionButtonWraper, MenuItemAction, ActionMenuItemWrapper } from './Action'

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

const VmDropdownActions = ({ actions, id }) => {
  if (actions.length === 0) {
    return null
  }

  if (actions.length === 1) {
    return <ActionButtonWraper {...actions[0]} className='btn btn-default' />
  }

  const primaryAction = actions[0]
  const secondaryActions = []
  for (const action of actions.slice(1)) {
    if (action.items) {
      secondaryActions.push(...action.items.filter(item => item && !item.actionDisabled))
    } else {
      secondaryActions.push(action)
    }
  }

  return (
    <Action confirmation={primaryAction.confirmation}>
      <SplitButton
        bsStyle='default'
        title={primaryAction.shortTitle}
        onClick={primaryAction.onClick}
        id={id}
      >
        {secondaryActions.map(action =>
          <MenuItemAction key={action.shortTitle}
            id={action.id}
            confirmation={action.confirmation}
            shortTitle={action.shortTitle}
            icon={action.icon}
            className=''
          />
        )}
      </SplitButton>
    </Action>
  )
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
    const {
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
    const isPoolVm = !!vm.getIn(['pool', 'id'], false)
    const isPool = !!pool && !isPoolVm
    const status = vm.get('status')
    const onStart = (isPool ? onStartPool : onStartVm)

    const vncConsole = vm.get('consoles').find(c => c.get('protocol') === 'vnc')
    const hasRdp = isWindows(vm.getIn(['os', 'type']))
    const consoles = vm.get('consoles').map((c) => ({
      priority: 0,
      shortTitle: msg[c.get('protocol') + 'Console'](),
      icon: <Icon name='external-link' />,
      id: `${idPrefix}-button-console-${c.get('protocol')}`,
      confirmation: (
        <ConsoleConfirmationModal consoleId={c.get('id')} vm={vm} />
      ),
    })).toJS()

    if (hasRdp) {
      const domain = config.get('domain')
      const username = config.getIn([ 'user', 'name' ])
      consoles.push({
        priority: 0,
        shortTitle: msg.rdpConsole(),
        icon: <Icon name='external-link' />,
        id: `${idPrefix}-button-console-rdp`,
        onClick: (e) => { e.preventDefault(); onRDP({ domain, username }) },
      })
    }

    if (vncConsole) {
      consoles.push({
        priority: 0,
        shortTitle: msg.vncConsoleBrowser(),
        actionDisabled: config.get('websocket') === null,
        id: `${idPrefix}-button-console-browser`,
        confirmation: (
          <ConsoleConfirmationModal isNoVNC consoleId={vncConsole.get('id')} vm={vm} />
        ),
      })
    }

    const actions = [
      {
        priority: 0,
        actionDisabled: (!isPool && !canStart(status)) || vm.getIn(['actionInProgress', 'start']) || (isPool && pool.get('maxUserVms') <= pool.get('vmsCount')),
        shortTitle: isPool ? msg.takeVm() : msg.run(),
        className: 'btn btn-success',
        id: `${idPrefix}-button-start`,
        onClick: onStart,
      },
      {
        priority: 1,
        actionDisabled: isPool || isPoolVm || !canSuspend(status) || vm.getIn(['actionInProgress', 'suspend']),
        shortTitle: msg.suspend(),
        className: 'btn btn-default',
        id: `${idPrefix}-button-suspend`,
        confirmation: (
          <ConfirmationModal
            title={msg.suspendVm()}
            body={msg.suspendVmQuestion()}
            confirm={{ title: msg.yes(), onClick: () => onSuspend() }}
          />
        ),
      },
      {
        priority: 0,
        actionDisabled: isPool || !canShutdown(status) || vm.getIn(['actionInProgress', 'shutdown']),
        shortTitle: msg.shutdown(),
        className: 'btn btn-default',
        id: `${idPrefix}-button-shutdown`,
        confirmation: (
          <ConfirmationModal accessibleDescription='one'
            title={msg.shutdownVm()}
            body={msg.shutdownVmQuestion()}
            confirm={{ title: msg.yes(), onClick: () => onShutdown() }}
            extra={{ title: msg.force(), onClick: () => onForceShutdown() }}
            subContent={isPoolVm && pool && vm.get('stateless') ? msg.shutdownStatelessPoolVm({ poolName: pool.get('name') }) : null}
          />
        ),
      },
      {
        priority: 0,
        actionDisabled: isPool || !canRestart(status) || vm.getIn(['actionInProgress', 'restart']),
        shortTitle: msg.reboot(),
        className: 'btn btn-default',
        id: `${idPrefix}-button-reboot`,
        confirmation: (
          <ConfirmationModal
            title={msg.rebootVm()}
            body={msg.rebootVmQuestion()}
            confirm={{ title: msg.yes(), onClick: () => onRestart() }}
          />
        ),
      },
      {
        priority: 0,
        actionDisabled: isPool || !canConsole(status) || vm.getIn(['actionInProgress', 'getConsole']),
        shortTitle: msg.console(),
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
        title={msg.removeVm()}
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
        confirm={{ title: msg.remove(), type: 'danger', onClick: () => onRemove({ preserveDisks: this.state.removePreserveDisks }) }}
      />)

    return (<React.Fragment>
      <div className={`actions-line ${style['actions-toolbar']} visible-xs`} id={`${idPrefix}Kebab`}>
        <DropdownKebab id={`${idPrefix}Kebab-kebab`} pullRight>
          { actions.map(action => <ActionMenuItemWrapper key={action.id} {...action} />) }
          <ActionMenuItemWrapper
            confirmation={removeConfirmation}
            actionDisabled={isPool || !canRemove(status) || vm.getIn(['actionInProgress', 'remove'])}
            shortTitle={msg.remove()}
            className='btn btn-danger'
            id={`${idPrefix}Kebab-button-remove`}
          />
        </DropdownKebab>
      </div>

      <div className={`actions-line ${style['actions-toolbar']} hidden-xs`} id={idPrefix}>
        <EmptyAction state={status} isOnCard={isOnCard} />

        {actions.map(action => <ActionButtonWraper key={action.id} {...action} />)}

        <ActionButtonWraper
          confirmation={removeConfirmation}
          actionDisabled={isPool || !canRemove(status) || vm.getIn(['actionInProgress', 'remove'])}
          shortTitle={msg.remove()}
          className='btn btn-danger'
          id={`${idPrefix}-button-remove`}
        />
      </div>
    </React.Fragment>
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
