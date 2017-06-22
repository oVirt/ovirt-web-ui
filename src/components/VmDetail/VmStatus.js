import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { VmStatusIcon } from 'ovirt-ui-components'
import FieldHelp from '../FieldHelp/index'

import HostConsole, { hasUserHostConsoleAccess, CockpitAHREF } from '../HostConsole/index'

const VmStatus = ({ vm, hosts, config }) => {
  const value = vm.get('status') // TODO: translate

  if (hasUserHostConsoleAccess({ vm, hosts, config })) {
    const host = hosts.getIn(['hosts', vm.get('hostId')])

    const content = (
      <span>
        Runs on host: <CockpitAHREF host={host} />
      </span>)

    return (
      <span>
        <VmStatusIcon state={vm.get('status')} />
        &nbsp;
        <FieldHelp content={content} text={value} />
        &nbsp;
        <HostConsole vm={vm} />
      </span>
    )
  }

  // for non-admin user
  return (
    <span>
      <VmStatusIcon state={vm.get('status')} />
      &nbsp;
      {value}
    </span>
  )
}
VmStatus.propTypes = {
  vm: PropTypes.object.isRequired,
  hosts: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    hosts: state.hosts,
    config: state.config,
  })
)(VmStatus)
