import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'

import sharedStyle from '../sharedStyle.css'
import style from './style.css'

import VmActions from '../VmActions'
import VmIcon from '../VmIcon'
import VmStatusIcon from '../VmStatusIcon'

import { startPool } from '../../actions'

import { getOsHumanName } from '../utils'
import { enumMsg } from '../../intl'

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
    <div className={`col-xs-12 col-sm-6 col-md-4 col-lg-3`}>
      <div className='card-pf card-pf-view card-pf-view-select card-pf-view-single-select'>
        <div>
          <span className={sharedStyle['operating-system-label']}>{ osName }</span>
        </div>
        <div className='card-pf-body'>
          <div className={`card-pf-top-element ${style['card-icon']}`}>
            <Link to={`/pool/${pool.get('id')}`}>
              <VmIcon icon={icon} className={style['card-pf-icon']}
                missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
            </Link>
          </div>

          <h2 className={`card-pf-title text-center ${style['status-height']}`}>
            <Link to={`/pool/${pool.get('id')}`} className={style['vm-detail-link']}>
              <p className={`${style['vm-name']} ${style['crop']}`} title={pool.get('name')} data-toggle='tooltip' id={`${idPrefix}-status-name`}>
                {pool.get('name')}
              </p>
            </Link>
            <p className={`${style['vm-status']}`} id={`${idPrefix}-status`}>
              <VmStatusIcon state={state} />&nbsp;{stateValue}
            </p>
          </h2>

          <VmActions isOnCard vm={pool.get('vm')} onStart={onStart} pool={pool} />
        </div>
      </div>
    </div>
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
