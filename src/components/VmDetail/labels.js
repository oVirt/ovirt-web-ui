import React from 'react'
import PropTypes from 'prop-types'

import FieldHelp from '../FieldHelp/index'

import style from './style.css'

export const NextRunLabel = ({ vm }) => {
  if (!vm.get('nextRunExists')) {
    return null
  }

  return (<div className={style['vm-flag-container']}>
    <FieldHelp content='The virtual machine has pending configuration. To take effect, please reboot the virtual machine.'>
      <span className={'label label-info ' + style['vm-flag']}>Pending Changes</span>
    </FieldHelp>
  </div>)
}
NextRunLabel.propTypes = {
  vm: PropTypes.object.isRequired,
}

export const OptimizedForLabel = ({ vm }) => {
  switch (vm.get('type')) {
    case 'server':
      return (
        <div className={style['vm-flag-container']}>
          <FieldHelp content='The virtual machine configuration is optimized for server workload.'>
            <span className={'label label-info ' + style['vm-flag']}>Server</span>
          </FieldHelp>
        </div>)
    case 'desktop':
      return (
        <div className={style['vm-flag-container']}>
          <FieldHelp content='The virtual machine configuration is optimized for desktop workload.'>
            <span className={'label label-info ' + style['vm-flag']}>Desktop</span>
          </FieldHelp>
        </div>)
    case 'high_performance':
      return (
        <div className={style['vm-flag-container']}>
          <FieldHelp content='The virtual machine configuration is optimized for high performance workload.'>
            <span className={'label label-info ' + style['vm-flag']}>High Performance</span>
          </FieldHelp>
        </div>)

    default:
      return null
  }
}
OptimizedForLabel.propTypes = {
  vm: PropTypes.object.isRequired,
}
