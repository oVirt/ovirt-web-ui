import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import BaseCard from './BaseCard'

import sharedStyle from '../sharedStyle.css'

import VmActions from '../VmActions'
import VmStatusIcon from '../VmStatusIcon'

import { startVm } from '_/actions'

import { getOsHumanName, getVmIcon } from '../utils'
import { enumMsg } from '_/intl'

/**
 * Single icon-card in the list for a VM
 */
const Vm = ({ vm, icons, os, onStart }) => {
  const idPrefix = `vm-${vm.get('name')}`
  const state = vm.get('status')
  const stateValue = enumMsg('VmStatus', state)
  const osName = getOsHumanName(vm.getIn(['os', 'type']))
  const icon = getVmIcon(icons, os, vm)

  return (
    <BaseCard idPrefix={idPrefix}>
      <BaseCard.Header>
        <span className={sharedStyle['operating-system-label']} id={`${idPrefix}-os`}>{osName}</span>
      </BaseCard.Header>
      <BaseCard.Icon url={`/vm/${vm.get('id')}`} icon={icon} />
      <BaseCard.Title url={`/vm/${vm.get('id')}`} name={vm.get('name')} />
      <BaseCard.Status>
        <VmStatusIcon state={state} />&nbsp;{stateValue}
      </BaseCard.Status>
      <VmActions isOnCard vm={vm} onStart={onStart} idPrefix={idPrefix} />
    </BaseCard>
  )
}
Vm.propTypes = {
  vm: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  os: PropTypes.object.isRequired,
  onStart: PropTypes.func.isRequired,
}

export default withRouter(connect(
  (state) => ({
    icons: state.icons,
    os: state.operatingSystems, // deep immutable, {[id: string]: OperatingSystem}
  }),
  (dispatch, { vm }) => ({
    onStart: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(Vm))
