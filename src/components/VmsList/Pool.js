import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { startPool } from '_/actions'
import { withMsg } from '_/intl'
import { getOsHumanName } from '_/components/utils'

import BaseCard from './BaseCard'
import VmActions from '../VmActions'

import sharedStyle from '../sharedStyle.css'
import style from './style.css'
import { InfoTooltip } from '_/components/tooltips'
import { ICON, NAME, STATUS, POOL_INFO, OS, ACTIONS } from '_/utils'

import {
  Td,
  Tr,
} from '@patternfly/react-table'
import { translate } from '_/helpers'

const connectPool = (WrappedComponent) => {
  const EnhancedComponent = ({ pool, icons, msg, ...otherProps }) => {
    const calculatedProps = {
      idPrefix: `pool-${pool.get('name')}`,
      icon: icons[pool.getIn(['vm', 'icons', 'large', 'id'], '')],
      tooltip: msg.maxNumberOfVms({ numberOfVms: pool.get('maxUserVms') }),
      osName: getOsHumanName(pool.getIn(['vm', 'os', 'type'])),
    }

    const forwardedProps = {
      pool,
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
    pool: PropTypes.object.isRequired,
    icons: PropTypes.object.isRequired,
    onStart: PropTypes.func.isRequired,
    msg: PropTypes.object.isRequired,
  }
  return withRouter(connect(
    (state) => ({
      icons: state.icons,
    }),
    (dispatch, { pool }) => ({
      onStart: () => dispatch(startPool({ poolId: pool.get('id') })),
    })
  )(withMsg(EnhancedComponent)))
}

/**
 * Single icon-card in the list for a Pool
 */
const CardPool = ({ pool, idPrefix, osName, icon, tooltip, onStart, msg }) => {
  return (
    <BaseCard idPrefix={idPrefix} topLineColor={pool.get('color')}>
      <BaseCard.Header>
        <span className={`${sharedStyle['operating-system-label']} ${style['pool-os-label']}`}>{ osName }</span>
        <span className={style['pool-vm-label']} style={{ backgroundColor: pool.get('color') }}>{ pool.get('name') }</span>
      </BaseCard.Header>
      <BaseCard.Icon icon={icon} />
      <BaseCard.Title name={pool.get('name')} />
      <BaseCard.Status idPrefix={idPrefix}>
        <dl className={style['pool-info']}>
          <dt>{msg.allocatedVms()} <InfoTooltip id={`${idPrefix}-info-tooltip`} tooltip={tooltip} /> </dt><dd>{pool.get('vmsCount')}</dd>
          <dt>{msg.availableVmsFromPool()}</dt><dd>{pool.get('maxUserVms')}</dd>
        </dl>
      </BaseCard.Status>
      <VmActions className={style['actions-container']} isOnCard vm={pool.get('vm')} pool={pool} onStart={onStart} idPrefix={idPrefix} />
    </BaseCard>
  )
}
CardPool.propTypes = {
  pool: PropTypes.object.isRequired,
  idPrefix: PropTypes.string.isRequired,
  osName: PropTypes.string.isRequired,
  icon: PropTypes.object,
  tooltip: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

const TablePool = ({ pool, idPrefix, osName, icon, tooltip, onStart, msg, columns }) => {
  const columnDefinition = {
    [ICON]: <span><BaseCard.Icon icon={icon} /></span>,

    [STATUS]: (
      <BaseCard.Status>
        {msg.poolStatus({ allocatedVms: pool.get('vmsCount'), totalVms: pool.get('maxUserVms') })}&nbsp;<InfoTooltip id={`${idPrefix}-info-tooltip`} tooltip={tooltip} />
      </BaseCard.Status>),
    [NAME]: <BaseCard.Title name={pool.get('name')} />,
    [POOL_INFO]: <span className={style['pool-vm-label']} style={{ backgroundColor: pool.get('color') }}>{ pool.get('name') }</span>,
    [OS]: osName,
    [ACTIONS]: (
      <VmActions
        className={style['actions-container']}
        isOnCard
        vm={pool.get('vm')}
        pool={pool}
        onStart={onStart}
        idPrefix={idPrefix}
      />),
  }
  return (
    <Tr key={pool.get('id')}>
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
TablePool.propTypes = {
  pool: PropTypes.object.isRequired,
  idPrefix: PropTypes.string.isRequired,
  osName: PropTypes.string.isRequired,
  icon: PropTypes.object,
  tooltip: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,

  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      messageDescriptor: PropTypes.object,
      sort: PropTypes.bool,
    })).isRequired,
}

const ConnectedCardPool = connectPool(CardPool)
const ConnectedTablePool = connectPool(TablePool)

export {
  ConnectedCardPool as CardPool,
  ConnectedTablePool as TablePool,
}
