import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { startVm } from '_/actions'
import { enumMsg, withMsg } from '_/intl'
import { getOsHumanName, getVmIcon } from '_/components/utils'

import BaseCard from './BaseCard'
import VmActions from '../VmActions'
import VmStatusIcon from '../VmStatusIcon'

import sharedStyle from '../sharedStyle.css'
import style from './style.css'

/**
 * Single icon-card in the list for a VM
 */
const Vm = ({ vm, icons, os, vms, onStart, msg }) => {
  const idPrefix = `vm-${vm.get('name')}`
  const osName = getOsHumanName(vm.getIn(['os', 'type']))
  const icon = getVmIcon(icons, os, vm)
  const status = vm.get('status')
  const statusValue = enumMsg('VmStatus', status, msg)

  const poolId = vm.getIn(['pool', 'id'])
  const isPoolVm = !!poolId
  const pool = isPoolVm ? vms.getIn(['pools', poolId]) : null

  return (
    <BaseCard idPrefix={idPrefix}>
      <BaseCard.Header>
        <span className={sharedStyle['operating-system-label']} id={`${idPrefix}-os`}>{osName}</span>
        {isPoolVm && pool && <span className={style['pool-vm-label']} style={{ backgroundColor: pool.get('color') }}>{ pool.get('name') }</span>}
      </BaseCard.Header>
      <BaseCard.Icon url={`/vm/${vm.get('id')}`} icon={icon} />
      <BaseCard.Title
        url={`/vm/${vm.get('id')}`}
        name={vm.get('name')}
      />
      <BaseCard.Status>
        <VmStatusIcon id={`${idPrefix}-status-icon`} status={status} />&nbsp;{statusValue}
      </BaseCard.Status>
      <VmActions isOnCard vm={vm} pool={pool} onStart={onStart} idPrefix={idPrefix} />
    </BaseCard>
  )
}
Vm.propTypes = {
  vm: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  vms: PropTypes.object.isRequired,
  os: PropTypes.object.isRequired,
  onStart: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default withRouter(connect(
  (state) => ({
    icons: state.icons,
    vms: state.vms,
    os: state.operatingSystems, // deep immutable, {[id: string]: OperatingSystem}
  }),
  (dispatch, { vm }) => ({
    onStart: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(withMsg(Vm)))
