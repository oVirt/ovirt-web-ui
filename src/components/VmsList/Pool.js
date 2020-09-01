import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { startPool } from '_/actions'
import { msg } from '_/intl'
import { getOsHumanName } from '_/components/utils'

import { FieldLevelHelp } from 'patternfly-react'
import BaseCard from './BaseCard'
import VmActions from '../VmActions'

import sharedStyle from '../sharedStyle.css'
import style from './style.css'

/**
 * Single icon-card in the list for a Pool
 */
const Pool = ({ pool, icons, onStart }) => {
  const idPrefix = `pool-${pool.get('name')}`
  const osName = getOsHumanName(pool.getIn(['vm', 'os', 'type']))
  const iconId = pool.getIn(['vm', 'icons', 'large', 'id'])
  const icon = icons.get(iconId)

  return (
    <BaseCard idPrefix={idPrefix}>
      <BaseCard.Header>
        <div className={style['pool-top-line']} style={{ backgroundColor: pool.get('color') }} />
        <span className={`${sharedStyle['operating-system-label']} ${style['pool-os-label']}`}>{ osName }</span>
        <span className={style['pool-vm-label']} style={{ backgroundColor: pool.get('color') }}>{ pool.get('name') }</span>
      </BaseCard.Header>
      <BaseCard.Icon icon={icon} />
      <BaseCard.Title idPrefix={idPrefix} name={pool.get('name')} useTooltip={false} />
      <BaseCard.Status idPrefix={idPrefix}>
        <dl className={style['pool-info']}>
          <dt>{msg.allocatedVms()} <FieldLevelHelp content={msg.maxNumberOfVms({ numberOfVms: pool.get('maxUserVms') })} inline /></dt><dd>{pool.get('vmsCount')}</dd>
          <dt>{msg.availableVmsFromPool()}</dt><dd>{pool.get('maxUserVms')}</dd>
        </dl>
      </BaseCard.Status>
      <VmActions isOnCard vm={pool.get('vm')} pool={pool} onStart={onStart} idPrefix={idPrefix} />
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
