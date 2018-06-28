import React from 'react'
import PropTypes from 'prop-types'

import style from './style.css'

const Icon = ({ className, tooltip }) => (
  <span title={tooltip} data-toggle='tooltip' data-placement='left'>
    <i className={className} />
  </span>
)

Icon.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
}

/**
 * Status-dependant icon for a VM
 */
const VmStatusIcon = ({ state }) => {
  switch (state) {
    case 'up':
      return <Icon className={`pficon pficon-on-running ${style['green']}`} tooltip='The VM is running.' />
    case 'powering_up':
      return <Icon className='pficon pficon-in-progress' tooltip='The VM is powering up.' />
    case 'down':
      return <Icon className='pficon pficon-off' tooltip='The VM is down.' />
    case 'paused':
      return <Icon className='pficon pficon-paused' tooltip='The VM is paused.' />
    case 'suspended':
      return <Icon className='pficon pficon-asleep' tooltip='The VM is suspended.' />
    case 'powering_down':
      return <Icon className='pficon pficon-in-progress' tooltip='The VM is going down.' />
    case 'not_responding':
      return <Icon className='pficon pficon-warning-triangle-o' tooltip='The VM is not responding.' />
    case 'unknown':
      return <Icon className='pficon pficon-unknown' tooltip='The VM status is unknown.' />
    case 'unassigned':
      return <Icon className='pficon pficon-unknown' tooltip='The VM status is unassigned.' />
    case 'migrating':
      return <Icon className='pficon pficon-migration' tooltip='The VM is being migrated.' />
    case 'wait_for_launch':
      return <Icon className='pficon pficon-pending' tooltip='The VM is scheduled for launch.' />
    case 'reboot_in_progress':
      return <Icon className='pficon pficon-in-progress' tooltip='The VM is being rebooted.' />
    case 'saving_state':
      return <Icon className='pficon pficon-pending' tooltip='The VM is saving its state.' />
    case 'restoring_state':
      return <Icon className='pficon pficon-in-progress' tooltip='The VM is restoring its state.' />
    case 'image_locked':
      return <Icon className='pficon pficon-locked' tooltip="The VM's image is locked" />

    case undefined: // better not to happen ...
      console.info(`VmStatusIcon component: VM state is undefined`)
      return (<div />)
    default: // better not to happen ...
      console.info(`VmStatusIcon component: unrecognized VM state '${state}'`)
      return <Icon className='pficon pficon-zone' tooltip={`The VM state is '${state}'`} />
  }
}
VmStatusIcon.propTypes = {
  state: PropTypes.string.isRequired,
}

export default VmStatusIcon
