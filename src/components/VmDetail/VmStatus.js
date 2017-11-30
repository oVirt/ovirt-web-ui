import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { VmStatusIcon } from 'ovirt-ui-components'
import FieldHelp from '../FieldHelp/index'
import { msg, enumMsg } from '../../intl'

import HostConsole, { hasUserHostConsoleAccess, CockpitAHREF } from '../HostConsole/index'

const VmStatus = ({ vm, hosts, config }) => {
  const status = vm.get('status')
  const value = enumMsg('VmStatus', status)
  let hostContent, detailContent

  if (hasUserHostConsoleAccess({ vm, hosts, config })) {
    const host = hosts.getIn(['hosts', vm.get('hostId')])

    hostContent = (
      <p>
        Runs on host: <CockpitAHREF host={host} />
      </p>)
  }

  if (vm.get('statusDetail')) {
    const reason = vm.get('statusDetail') === 'noerr' ? msg.noError() : vm.get('statusDetail')
    detailContent = (
      <p>
        Reason: {reason}
      </p>)
  }

  let content = null
  if (hostContent || detailContent) {
    content = (
      <div>
        {hostContent}
        {detailContent}
      </div>
    )
  }

  return (
    <span id={`${vm.get('name')}-status`}>
      <VmStatusIcon state={vm.get('status')} />
      &nbsp;
      {content ? <FieldHelp content={content} text={value} container={null} /> : value}
      <HostConsole vm={vm} />
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
