import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import BaseCard from './BaseCard'

import sharedStyle from '../sharedStyle.css'

import VmActions from '../VmActions'
import VmStatusIcon from '../VmStatusIcon'

import { startPool } from '_/actions'

import { getOsHumanName } from '../utils'
import { enumMsg } from '_/intl'

/**
 * Single icon-card in the list for a Pool
 */
const Pool = ({ pool, icons, onStart }) => {
  const idPrefix = `pool-${pool.get('name')}`
  const state = pool.get('status')
  const stateValue = enumMsg('VmStatus', state)
  const osName = getOsHumanName(pool.getIn(['vm', 'os', 'type']))
  const iconId = pool.getIn(['vm', 'icons', 'large', 'id'])
  const icon = icons.get(iconId)

  return (
    <BaseCard idPrefix={idPrefix}>
      <BaseCard.Header>
        <span className={sharedStyle['operating-system-label']}>{ osName }</span>
      </BaseCard.Header>
      <BaseCard.Icon url={`/pool/${pool.get('id')}`} icon={icon} />
      <BaseCard.Title idPrefix={idPrefix} url={`/pool/${pool.get('id')}`} name={pool.get('name')} />
      <BaseCard.Status idPrefix={idPrefix}>
        <VmStatusIcon state={state} />&nbsp;{stateValue}
      </BaseCard.Status>
      <VmActions isOnCard vm={pool.get('vm')} onStart={onStart} pool={pool} />
    </BaseCard>
  )
}
Pool.propTypes = {
  pool: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  onStart: PropTypes.func.isRequired,
}

export default withRouter(connect(
  (state) => ({
    icons: state.icons,
  }),
  (dispatch, { pool }) => ({
    onStart: () => dispatch(startPool({ poolId: pool.get('id') })),
  })
)(Pool))
