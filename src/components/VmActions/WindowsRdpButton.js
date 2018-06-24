import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { getRDP } from '../../actions'
import { isWindows, hrefWithoutHistory } from '../../helpers'
import { canConsole } from '../../vm-status'

/**
 * Button to send a RDP connection file to the user for a Windows VM.
 */
const WindowsRdpButton = ({ vm, className, onRDP }) => {
  const isWindowsVM = isWindows(vm.getIn(['os', 'type']))

  let component = null
  if (isWindowsVM && canConsole(vm.get('status'))) {
    const idPrefix = `consoleaction-${vm.get('name')}`
    component = (
      <a href='#' key={vm.get('id')} id={`${idPrefix}-rdp`} onClick={hrefWithoutHistory(onRDP)} className={className}>
        RDP
      </a>
    )
  }

  return component
}
WindowsRdpButton.propTypes = {
  vm: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired,

  config: PropTypes.object.isRequired, // eslint-disable-line react/no-unused-prop-types
  onRDP: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch, { vm, config }) => ({
    onRDP: () => dispatch(getRDP({
      vmName: vm.get('name'),
      fqdn: vm.get('fqdn'),
      domain: config.get('domain'),
      username: config.getIn([ 'user', 'name' ]),
    })),
  })
)(WindowsRdpButton)
