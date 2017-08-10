import React from 'react'
import PropTypes from 'prop-types'

import FieldHelp from '../FieldHelp/index'
import { msg } from '../../intl'

import style from './style.css'

export const NextRunLabel = ({ vm }) => {
  if (!vm.get('nextRunExists')) {
    return null
  }

  return (<div className={style['vm-flag-container']}>
    <FieldHelp content={msg.vmHasPendingConfigurationChanges()}>
      <span className={'label label-info ' + style['vm-flag']}>{msg.pendingChanges()}</span>
    </FieldHelp>
  </div>)
}
NextRunLabel.propTypes = {
  vm: PropTypes.object.isRequired,
}
