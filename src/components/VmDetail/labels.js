import React from 'react'
import PropTypes from 'prop-types'

import FieldHelp from '../FieldHelp/index'
import { msg } from 'app-intl'

import style from './style.css'

export const NextRunLabel = ({ vm }) => {
  if (!vm.get('nextRunExists')) {
    return null
  }
  const idPrefix = `${vm.get('name')}-nextrun`
  return (<div className={style['vm-flag-container']}>
    <FieldHelp content={msg.vmHasPendingConfigurationChanges()}>
      <span className={'label label-info ' + style['vm-flag']} id={`${idPrefix}-changes`}>{msg.pendingChanges()}</span>
    </FieldHelp>
  </div>)
}
NextRunLabel.propTypes = {
  vm: PropTypes.object.isRequired,
}
