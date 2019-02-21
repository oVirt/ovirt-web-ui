import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { push } from 'connected-react-router'
import { DropdownButton, MenuItem, Icon } from 'patternfly-react'
import ConsoleConfirmationModal from '../VmActions/ConsoleConfirmationModal'
import { MenuItemAction } from '../VmActions/Action'
import { DOWNLOAD_CONSOLE } from '_/constants'
import { msg } from '_/intl'
import { getRDP } from '_/actions'

import { isWindows } from '_/helpers'
import style from './style.css'

class VmConsoleSelector extends React.Component {
  render () {
    const { vmId, vms, consoles, config, consoleId, isConsolePage, onRDP } = this.props
    let actions = vms.getIn(['vms', vmId, 'consoles'])
    if (actions.size === 0) {
      return <div />
    }
    const activeConsole = consoleId === 'rdp'
      ? msg.rdpConsole()
      : consoles.getIn(['vms', vmId, 'consoleStatus']) === DOWNLOAD_CONSOLE
        ? msg[actions.find((a) => a.get('id') === consoleId).get('protocol') + 'Console']()
        : msg.vncConsoleBrowser()
    const vnc = actions.find((a) => a.get('protocol') === 'vnc')
    const consoleItems = actions.map(action =>
      <MenuItemAction
        id={action.get('id')}
        key={action.get('id')}
        confirmation={<ConsoleConfirmationModal isConsolePage={isConsolePage} vm={vms.getIn(['vms', vmId])} consoleId={action.get('id')} onClose={() => {}} />}
        shortTitle={msg[action.get('protocol') + 'Console']()}
        icon={<Icon name='external-link' />}
      />
    ).toJS()

    const hasRdp = isWindows(vms.getIn(['vms', vmId, 'os', 'type']))

    if (hasRdp) {
      const domain = config.get('domain')
      const username = config.getIn([ 'user', 'name' ])
      consoleItems.push(<MenuItem
        key='rdp'
        onClick={(e) => { e.preventDefault(); onRDP({ domain, username }) }}
      >
        {msg.rdpConsole()} <Icon name='external-link' />
      </MenuItem>)
    }

    if (vnc.size) {
      consoleItems.push(
        <MenuItemAction
          id={`${vnc.get('id')}_browser`}
          key={`${vnc.get('id')}_browser`}
          confirmation={<ConsoleConfirmationModal isConsolePage={isConsolePage} isNoVNC vm={vms.getIn(['vms', vmId])} consoleId={vnc.get('id')} onClose={() => {}} />}
          shortTitle={msg.vncConsoleBrowser()}
        />
      )
    }
    return <div className={style['console-dropdown-box']}>
      <span className={style['console-dropdown-label']}>{`${msg.console()}:`}</span>
      <DropdownButton
        title={activeConsole}
        bsStyle='default'
        id='console-selector'
      >
        { consoleItems }
      </DropdownButton>
    </div>
  }
}

VmConsoleSelector.propTypes = {
  vmId: PropTypes.string.isRequired,
  consoleId: PropTypes.string.isRequired,
  isConsolePage: PropTypes.bool,
  vms: PropTypes.object.isRequired,
  consoles: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  onRDP: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    consoles: state.consoles,
    config: state.config,
  }),
  (dispatch, { vms, vmId }) => ({
    onRDP: ({ domain, username }) => {
      dispatch(getRDP({ name: vms.getIn(['vms', vmId, 'name']), fqdn: vms.getIn(['vms', vmId, 'fqdn']), domain, username }))
      dispatch(push('/vm/' + vmId + '/console/rdp'))
    },
  })
)(VmConsoleSelector)
