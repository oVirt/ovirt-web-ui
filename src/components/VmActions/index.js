import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { withMsg } from '_/intl'

import {
  canRestart,
  canShutdown,
  canStart,
  canConsole,
  canSuspend,
  canRemove,
  canExternalService,
} from '../../vm-status'

import * as Actions from '_/actions'

import { toJS, translate } from '_/helpers'

import { Checkbox } from '@patternfly/react-core'
import { getConsoles, isNativeConsole } from '_/utils/console'
import VmDropdownActions from './VmDropdownActions'
import VmDetailsActions from './VmDetailsActions'
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons'

export function getConsoleActions ({ vm, msg, onOpenConsole, idPrefix, config, preferredConsole }) {
  return getConsoles({
    vmConsoles: toJS(vm.get('consoles')),
    vmOsType: vm.getIn(['os', 'type']),
    websocket: config.get('websocket'),
    defaultVncMode: config.get('defaultVncMode'),
    preferredConsole,
  }).map(({ consoleType, shortTitle, ...rest }) => ({
    consoleType,
    shortTitle: translate({ ...shortTitle, msg }),
    ...rest,
    id: `${idPrefix}-${consoleType}`,
    icon: isNativeConsole(consoleType) ? <ExternalLinkAltIcon /> : undefined,
    onClick: () => { onOpenConsole({ consoleType }) },
  }))
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
      onOpenConsole,
      msg,
      preferredConsole,
    } = this.props
    const isPoolVm = !!vm.getIn(['pool', 'id'], false)
    const isPool = !!pool && !isPoolVm
    const status = vm.get('status')
    const onStart = (isPool ? onStartPool : onStartVm)

    const consoles = getConsoleActions({ vm, msg, onOpenConsole, idPrefix, config, preferredConsole })

    const actions = [
      {
        priority: 0,
        actionDisabled: (!isPool && !canStart(status)) || vm.getIn(['actionInProgress', 'start']) || (isPool && pool.get('maxUserVms') <= pool.get('vmsCount')),
        shortTitle: isPool ? msg.takeVm() : msg.run(),
        variant: 'primary',
        id: `${idPrefix}-button-start`,
        onClick: onStart,
      },
      {
        priority: 0,
        actionDisabled: isPool || isPoolVm || !canSuspend(status) || vm.getIn(['actionInProgress', 'suspend']),
        shortTitle: msg.suspend(),
        id: `${idPrefix}-button-suspend`,
        confirmation: {
          title: msg.suspendVm(),
          body: msg.suspendVmQuestion(),
          confirm: { title: msg.yes(), onClick: () => onSuspend() },
        },
      },
      {
        priority: 0,
        actionDisabled: isPool || !canShutdown(status) || vm.getIn(['actionInProgress', 'shutdown']),
        shortTitle: msg.shutdown(),
        id: `${idPrefix}-button-shutdown`,
        confirmation: {
          title: msg.shutdownVm(),
          body: msg.shutdownVmQuestion(),
          confirm: { title: msg.yes(), onClick: () => onShutdown() },
          extra: { title: msg.force(), onClick: () => onForceShutdown() },
          subContent: isPoolVm && pool && vm.get('stateless') ? msg.shutdownStatelessPoolVm({ poolName: pool.get('name') }) : null,
        },
      },
      {
        priority: 0,
        actionDisabled: isPool || !canRestart(status) || vm.getIn(['actionInProgress', 'restart']),
        shortTitle: msg.reboot(),
        id: `${idPrefix}-button-reboot`,
        confirmation: {
          title: msg.rebootVm(),
          body: msg.rebootVmQuestion(),
          confirm: { title: msg.yes(), onClick: () => onRestart() },
        },
      },
      {
        priority: 1,
        actionDisabled: isPool || !canConsole(status) || vm.getIn(['actionInProgress', 'getConsole']) || !consoles.length,
        shortTitle: msg.console(),
        id: `${idPrefix}-button-console`,
        items: consoles,
      },
    ]

    // add custom service buttons based on value of the
    // external_service custom VM param.
    const fqdn = vm.get('fqdn')
    const servicesRaw = vm.get('customProperties').find(prop => prop.get('name') === 'external_service')
    if (servicesRaw && servicesRaw.get('value')) {
      // external_service is a bar deliniated list of NAME/PROTOCOL/PORT
      // multiple services can be defined by chaining them with a comma
      const services = servicesRaw.get('value').split(',').map(svc => svc.split('/')).filter(svc => svc.length === 3)

      let idx = 0
      for (const [serviceName, protocol, port] of services) {
        actions.push({
          priority: 0,
          actionDisabled: isPool || !canExternalService(status, fqdn),
          shortTitle: serviceName,
          id: `${idPrefix}-button-svc-${idx++}`,
          onClick: () => window.open(`${protocol}://${fqdn}:${port}`),
        })
      }
    }

    return actions
  }

  render () {
    let {
      vm,
      pool,
      isOnCard = false,
      idPrefix = `vmaction-${vm.get('name')}`,
      onRemove,
      msg,
      className = '',
    } = this.props
    const {
      removePreserveDisks,
    } = this.state

    const isPool = !!pool
    const status = vm.get('status')

    const actions = this.getDefaultActions()

    idPrefix = `${idPrefix}-actions`

    // Actions for Card
    if (isOnCard) {
      return (
        <div className={`text-center ${className}`} id={idPrefix}>
          <VmDropdownActions id={`${idPrefix}-dropdown`} actions={actions} />
        </div>
      )
    }

    // Actions for the Toolbar
    const removeAction = {
      actionDisabled: isPool || !canRemove(status) || vm.getIn(['actionInProgress', 'remove']),
      shortTitle: msg.remove(),
      variant: 'danger',
      id: `${idPrefix}Kebab-button-remove`,
      confirmation: {
        title: msg.removeVm(),
        body: msg.removeVmQustion(),
        subContent: (
          <>
            {vm.get('disks').size > 0 && (
              <Checkbox
                id={`${idPrefix}-preservedisks`}
                isChecked={removePreserveDisks}
                onChange={(value) => this.setState({ removePreserveDisks: value }) }
                label={msg.preserveDisks()}
              />
            )}
          </>
        ),
        confirm: { title: msg.remove(), type: 'danger', onClick: () => onRemove({ preserveDisks: removePreserveDisks }) },
      },
    }

    return (
      <VmDetailsActions
        id={`${idPrefix}-toolbar`}
        actions={[...actions, { ...removeAction }]}
        idPrefix={idPrefix}
      />
    )
  }
}

VmActions.propTypes = {
  vm: PropTypes.object.isRequired,
  pool: PropTypes.object,
  config: PropTypes.object.isRequired,
  isOnCard: PropTypes.bool,
  idPrefix: PropTypes.string,

  onShutdown: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onForceShutdown: PropTypes.func.isRequired,
  onSuspend: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onStartPool: PropTypes.func.isRequired,
  onStartVm: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  preferredConsole: PropTypes.string,
  onOpenConsole: PropTypes.func.isRequired,
  className: PropTypes.string,
}

export default withRouter(
  connect(
    (state, { vm }) => ({
      isEditable: vm.get('canUserEditVm') && state.clusters.find(cluster => cluster.get('canUserUseCluster')) !== undefined,
      config: state.config,
      preferredConsole: state.options.getIn(['remoteOptions', 'preferredConsole', 'content'], state.config.get('defaultUiConsole')),
    }),
    (dispatch, { vm, pool }) => ({
      onShutdown: () => dispatch(Actions.shutdownVm({ vmId: vm.get('id'), force: false })),
      onRestart: () => dispatch(Actions.restartVm({ vmId: vm.get('id'), force: false })),
      onForceShutdown: () => dispatch(Actions.shutdownVm({ vmId: vm.get('id'), force: true })),
      onSuspend: () => dispatch(Actions.suspendVm({ vmId: vm.get('id') })),
      onRemove: ({ preserveDisks }) => dispatch(Actions.removeVm({ vmId: vm.get('id'), preserveDisks })),
      onStartPool: () => dispatch(Actions.startPool({ poolId: pool.get('id') })),
      onStartVm: () => dispatch(Actions.startVm({ vmId: vm.get('id') })),
      onOpenConsole: ({ consoleType }) => {
        dispatch(Actions.openConsole({
          vmId: vm.get('id'),
          consoleType,
        }))
      },
    })
  )(withMsg(VmActions))
)
