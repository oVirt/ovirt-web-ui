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

import {
  Td,
  Tr,
} from '@patternfly/react-table'

import { ICON, NAME, STATUS, POOL_INFO, OS, ACTIONS } from '_/utils'

import sharedStyle from '../sharedStyle.css'
import style from './style.css'
import { translate } from '_/helpers'

const connectVm = (WrappedComponent) => {
  const EnhancedComponent = ({ vm, icons, os, vms, msg, ...otherProps }) => {
    const poolId = vm.getIn(['pool', 'id'])
    const isPoolVm = !!poolId
    const status = vm.get('status')
    const calculatedProps = {
      idPrefix: `vm-${vm.get('name')}`,
      osName: getOsHumanName(vm.getIn(['os', 'type'])),
      icon: getVmIcon(icons, os, vm),
      status,
      statusValue: enumMsg('VmStatus', status, msg),
      poolId,
      isPoolVm,
      pool: isPoolVm ? vms.getIn(['pools', poolId]) : null,
    }
    const forwardedProps = {
      vm,
      msg,
    }
    return (
      <WrappedComponent
        {...otherProps}
        {...calculatedProps}
        {...forwardedProps}
      />
    )
  }
  EnhancedComponent.propTypes = {
    vm: PropTypes.object.isRequired,
    icons: PropTypes.object.isRequired,
    vms: PropTypes.object.isRequired,
    os: PropTypes.object.isRequired,
    msg: PropTypes.object.isRequired,
  }
  return withRouter(
    connect(
      (state) => ({
        icons: state.icons,
        vms: state.vms,
        os: state.operatingSystems, // deep immutable, {[id: string]: OperatingSystem}
      }),
      (dispatch, { vm }) => ({
        onStart: () => dispatch(startVm({ vmId: vm.get('id') })),
      })
    )(withMsg(EnhancedComponent)))
}

/**
 * Single icon-card in the list for a VM
 */
const TableVm = ({
  vm,
  idPrefix,
  osName,
  icon,
  status,
  statusValue,
  isPoolVm,
  pool,
  onStart,
  msg,
  columns,
}) => {
  // the order of columns is determined by the parent
  const columnDefinition = {
    [ICON]: (
      <BaseCard.Icon
        url={`/vm/${vm.get('id')}`}
        icon={icon}
      />),
    [STATUS]: (
      <BaseCard.Status>
        <VmStatusIcon id={`${idPrefix}-status-icon`} status={status} />&nbsp;{statusValue}
      </BaseCard.Status>),
    [NAME]: (
      <BaseCard.Title
        url={`/vm/${vm.get('id')}`}
        name={vm.get('name')}
      />),
    [POOL_INFO]: (
      <>
        {isPoolVm && pool && (
          <span
            className={style['pool-vm-label']}
            style={{ backgroundColor: pool.get('color') }}
          >
            { pool.get('name') }
          </span>
        )}
        {!isPoolVm && <span className={style['pool-vm-label']}/>}
      </>),
    [OS]: osName,
    [ACTIONS]: (
      <VmActions
        isOnCard
        className={style['actions-container']}
        vm={vm}
        pool={pool}
        onStart={onStart}
        idPrefix={idPrefix}
      />),
  }
  return (
    <Tr key={vm.get('id')}>
      {columns.map(({ id, messageDescriptor }) => (
        <Td
          key={id}
          dataLabel={messageDescriptor?.id ? translate({ ...messageDescriptor, msg }) : ''}
        >
          {columnDefinition[id] ?? null}
        </Td>
      ))}
    </Tr>
  )
}
TableVm.propTypes = {
  vm: PropTypes.object.isRequired,
  pool: PropTypes.object,
  icon: PropTypes.object,
  osName: PropTypes.string,
  status: PropTypes.string,
  statusValue: PropTypes.string,
  idPrefix: PropTypes.string,
  isPoolVm: PropTypes.bool.isRequired,
  onStart: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,

  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      messageDescriptor: PropTypes.object,
      sort: PropTypes.bool,
    })).isRequired,
}

const CardVm = ({ vm, idPrefix, osName, icon, status, statusValue, isPoolVm, pool, onStart, msg }) => {
  return (
    <BaseCard idPrefix={idPrefix}>
      <BaseCard.Header>
        <span className={sharedStyle['operating-system-label']} id={`${idPrefix}-os`}>{osName}</span>
        {isPoolVm && pool && <span className={style['pool-vm-label']} style={{ backgroundColor: pool.get('color') }}>{ pool.get('name') }</span>}
        {!isPoolVm && <span className={style['pool-vm-label']}/>}
      </BaseCard.Header>
      <BaseCard.Icon url={`/vm/${vm.get('id')}`} icon={icon} />
      <BaseCard.Title
        url={`/vm/${vm.get('id')}`}
        name={vm.get('name')}
      />
      <BaseCard.Status>
        <VmStatusIcon id={`${idPrefix}-status-icon`} status={status} />&nbsp;{statusValue}
      </BaseCard.Status>
      <VmActions isOnCard className={style['actions-container']} vm={vm} pool={pool} onStart={onStart} idPrefix={idPrefix} />
    </BaseCard>
  )
}
CardVm.propTypes = {
  vm: PropTypes.object.isRequired,
  pool: PropTypes.object,
  icon: PropTypes.object,
  osName: PropTypes.string,
  status: PropTypes.string,
  statusValue: PropTypes.string,
  idPrefix: PropTypes.string,
  isPoolVm: PropTypes.bool.isRequired,
  onStart: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

const ConnnectedTableVm = connectVm(TableVm)
const ConnectedCardVm = connectVm(CardVm)

export {
  ConnnectedTableVm as TableVm,
  ConnectedCardVm as CardVm,
}
