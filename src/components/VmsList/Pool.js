import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './style.css'

import VmStatusText from './VmStatusText'
import VmActions from '../VmActions'
import { VmIcon, VmStatusIcon } from 'ovirt-ui-components'

import { selectPoolDetail, startPool } from '../../actions'

/**
 * Single icon-card in the list
 */
const Pool = ({ pool, icons, onSelectPool, visibility, onStart }) => {
  const state = pool.get('status')

  const iconId = pool.getIn(['vm', 'icons', 'large', 'id'])
  const icon = icons.get(iconId)
  const isSelected = pool.get('id') === visibility.get('selectedPoolDetail')

  return (
    <div className={`col-xs-12 col-sm-6 col-md-4 col-lg-3 ${isSelected ? style['selectedPool'] : ''}`}>
      <div className='card-pf card-pf-view card-pf-view-select card-pf-view-single-select'>
        <div className='card-pf-body'>
          <div className='card-pf-top-element' onClick={onSelectPool}>
            <VmIcon icon={icon} className={style['card-pf-icon']}
              missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
          </div>
          <h2 className='card-pf-title text-center' onClick={onSelectPool}>
            <p className={[style['vm-name'], style['crop']].join(' ')} title={pool.get('name')} data-toggle='tooltip'>
              <VmStatusIcon state={state} />&nbsp;{pool.get('name')}
            </p>
          </h2>

          <VmActions vm={pool.get('vm')} isOnCard isPool onStart={onStart} />
          <VmStatusText vm={pool.get('vm')} />

        </div>
      </div>
    </div>
  )
}
Pool.propTypes = {
  pool: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  onSelectPool: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    icons: state.icons,
    visibility: state.visibility,
  }),
  (dispatch, { pool }) => ({
    onSelectPool: () => dispatch(selectPoolDetail({ poolId: pool.get('id') })),
    onStart: () => dispatch(startPool({ poolId: pool.get('id') })),
  })
)(Pool)
