import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { RouterPropTypeShapes } from '_/propTypeShapes'

import { push } from 'connected-react-router'

import { msg } from '_/intl'
import { canUserUseAnyClusters } from '_/utils'

import VmDialog from '../VmDialog'
import VmsList from '../VmsList'
import VmDetails from '../VmDetails'
import { default as LegacyVmDetails } from '../VmDetail'
import { SplitButton, MenuItem } from 'patternfly-react'

import { addUserMessage } from '_/actions'
import { VncConsole } from '@patternfly/react-console'
import ConsoleConfirmationModal from '../VmActions/ConsoleConfirmationModal'
import Action from '../VmActions/Action'
import { fromJS } from 'immutable'

/**
 * Route component (for PageRouter) to view the list of VMs and Pools
 */
const VmsPage = () => {
  return <VmsList />
}

/**
 * Route component (for PageRouter) to view a VM's details
 */
class VmDetailsPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      vmId: undefined,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.vmId !== props.match.params.id) {
      const vmId = props.match.params.id
      return { vmId }
    }

    return null
  }

  render () {
    const { vms } = this.props
    const { vmId } = this.state

    if (vmId && vms.getIn(['vms', vmId])) {
      return (<VmDetails vm={vms.getIn(['vms', vmId])} />)
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`VmDetailsPage: VM id cannot be found: ${vmId}`)
    return null
  }
}
VmDetailsPage.propTypes = {
  vms: PropTypes.object.isRequired,
  match: RouterPropTypeShapes.match.isRequired,
}
const VmDetailsPageConnected = connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({})
)(VmDetailsPage)

/**
 * Route component (for PageRouter) to view a Pool's details
 */
class PoolDetailsPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      poolId: undefined,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.poolId !== props.match.params.id) {
      const poolId = props.match.params.id

      return { poolId }
    }

    return null
  }

  render () {
    const { vms } = this.props
    const { poolId } = this.state

    if (poolId && vms.getIn(['pools', poolId, 'vm'])) {
      // TODO: ux-redesign VmDetails will need to also handle viewing a Pool / Pool (template)? VM
      return (<LegacyVmDetails vm={vms.getIn(['pools', poolId, 'vm'])} pool={vms.getIn(['pools', poolId])} />)
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`PoolDetailsPage: Pool id cannot be found: ${poolId}`)
    return null
  }
}
PoolDetailsPage.propTypes = {
  vms: PropTypes.object.isRequired,
  match: RouterPropTypeShapes.match.isRequired,
}
const PoolDetailsPageConnected = connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({})
)(PoolDetailsPage)

/**
 * Route component (for PageRouter) to create a new VM
 */
class VmCreatePage extends React.Component {
  componentDidUpdate () {
    // If the user cannot create any VMs (not just the one requested), bump them out
    if (!this.props.canUserCreateVMs) {
      this.props.redirectToMainPage()
      this.props.addUserMessage(msg.permissionsNoCreateVm())
    }
  }

  render () {
    if (!this.props.canUserCreateVMs) {
      return null
    }

    const { previousPath } = this.props
    return <VmDialog previousPath={previousPath} />
  }
}
VmCreatePage.propTypes = {
  canUserCreateVMs: PropTypes.bool.isRequired,
  previousPath: PropTypes.string.isRequired,

  redirectToMainPage: PropTypes.func.isRequired,
  addUserMessage: PropTypes.func.isRequired,
}
const VmCreatePageConnected = connect(
  (state) => ({
    canUserCreateVMs: canUserUseAnyClusters(state.clusters) && state.clusters.size > 0,
  }),
  (dispatch) => ({
    redirectToMainPage: () => dispatch(push('/')),
    addUserMessage: (message) => dispatch(addUserMessage({ message })),
  })
)(VmCreatePage)

class VmConsoleSelector extends React.Component {
  render () {
    const { vmId, id, vms, consoleId } = this.props
    let actions = vms.getIn(['vms', vmId, 'consoles'])
    actions = [...actions]
    if (actions.length === 0) {
      return <div />
    }
    return <SplitButton title='Spice Console' id={id}>
      { actions.map(action => {
        let selected = {}
        selected['active'] = action.get('id') === consoleId
        return <Action
          confirmation={<div><ConsoleConfirmationModal vm={fromJS({ id: vmId })} consoleId={action.get('id')}
          /></div>}
        >
          <MenuItem key={action.id} id={action.id}
            onClick={action.onClick} {...selected}>{action.get('protocol')}</MenuItem>
        </Action>
      }) }
    </SplitButton>
  }
}

VmConsoleSelector.propTypes = {
  vmId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  vms: PropTypes.object.isRequired,
  consoleId: PropTypes.string.isRequired,
}

const VmConsoleSelectorConnected = connect(
  (state) => ({
    vms: state.vms,
    consoles: state.consoles,
  })
)(VmConsoleSelector)

class VmConsolePage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      vmId: undefined,
      consoleId: undefined,
      disconnected: false,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.vmId !== props.match.params.id) {
      const vmId = props.match.params.id
      return { vmId }
    }
  }

  onDisconnected (e) {
    this.state({ disconnected: true })
  }

  render () {
    const host = window.location.hostname
    const confirmation = <ConsoleConfirmationModal vm={fromJS({ vm: this.state.vmId })} consoleId={this.props.match.console_id}
      onClose={() => {}} />
    if (this.props.consoles.getIn(['vms', this.state.vmId]) === undefined) {
      return <div>{confirmation}</div>
    }
    const proxyTicket = this.props.consoles.getIn(['vms', this.state.vmId, 'proxyTicket'])
    const ticket = this.props.consoles.getIn(['vms', this.state.vmId, 'ticket'])
    if (ticket !== undefined) {
      return <div><VncConsole encrypt credentials={{ password: ticket.value }}
        path={proxyTicket}
        host={host} port='6100' onDisconnected={this.onDisconnected} /></div>
    } else {
      return <div><VmConsoleSelector vmId={this.state.vmId} id='vm-selector' />Downloading vv file</div>
    }
  }
}

VmConsolePage.propTypes = {
  consoles: PropTypes.object.isRequired,
  match: RouterPropTypeShapes.match.isRequired,
}

const VmConsolePageConnected = connect(
  (state) => ({
    consoles: state.consoles,
  })
)(VmConsolePage)

export {
  PoolDetailsPageConnected as PoolDetailsPage,
  VmDetailsPageConnected as VmDetailsPage,
  VmCreatePageConnected as VmCreatePage,
  VmConsolePageConnected as VmConsolePage,
  VmConsoleSelectorConnected as VmConsoleSelector,
  VmsPage,
}
