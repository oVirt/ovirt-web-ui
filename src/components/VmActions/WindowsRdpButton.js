import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { getRDP } from '_/actions'
import { isWindows } from '_/helpers'
import { canConsole } from '_/vm-status'

/**
 * Button to send a RDP connection file to the user for a Windows VM.
 */
const WindowsRdpButton = ({ vm, className, config, onRDP, id }) => {
  const isWindowsVM = isWindows(vm.getIn(['os', 'type']))

  let component = null
  if (isWindowsVM && canConsole(vm.get('status'))) {
    const domain = config.get('domain')
    const username = config.getIn(['user', 'name'])

    component = (
      <a
        id={id}
        href='#'
        key={vm.get('id')}
        className={className}
        onClick={(e) => { e.preventDefault(); onRDP(domain, username) }}
      >
        RDP
      </a>
    )
  }

  return component
}
WindowsRdpButton.propTypes = {
  id: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired,

  config: PropTypes.object.isRequired,
  onRDP: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch, { vm }) => ({
    onRDP: (domain, username) => dispatch(getRDP({ name: vm.get('name'), fqdn: vm.get('fqdn'), domain, username })),
  })
)(WindowsRdpButton)
