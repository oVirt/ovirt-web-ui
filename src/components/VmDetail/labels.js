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
