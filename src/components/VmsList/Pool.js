import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import {
  Redirect,
  withRouter,
} from 'react-router-dom'

import style from './style.css'

import VmStatusText from './VmStatusText'
import VmActions from '../VmActions'
import { VmIcon, VmStatusIcon } from 'ovirt-ui-components'

import { startPool } from '../../actions'

/**
 * Single icon-card in the list
 */
class Pool extends React.Component {
  constructor (props) {
    super(props)
    this.state = { openDetail: false }
  }
  render () {
    let { pool, icons, visibility, onStart } = this.props
    if (this.state.openDetail) {
      return (<Redirect to={`/pool/${pool.get('id')}`} />)
    }

    const state = pool.get('status')

    const iconId = pool.getIn(['vm', 'icons', 'large', 'id'])
    const icon = icons.get(iconId)
    const isSelected = pool.get('id') === visibility.get('selectedPoolDetail')

    const onCardClick = () => {
      this.setState({ openDetail: true })
    }

    return (
      <div className={`col-xs-12 col-sm-6 col-md-4 col-lg-3 ${isSelected ? style['selectedPool'] : ''}`}>
        <div className='card-pf card-pf-view card-pf-view-select card-pf-view-single-select'>
          <div className='card-pf-body'>
            <div className='card-pf-top-element' onClick={onCardClick}>
              <VmIcon icon={icon} className={style['card-pf-icon']}
                missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
            </div>
            <h2 className='card-pf-title text-center' onClick={onCardClick}>
              <p className={[style['vm-name'], style['crop']].join(' ')} title={pool.get('name')} data-toggle='tooltip'>
                <VmStatusIcon state={state} />&nbsp;{pool.get('name')}
              </p>
            </h2>

            <VmActions vm={pool.get('vm')} isOnCard isPool onStart={onStart} pool={pool} />
            <VmStatusText vm={pool.get('vm')} />

          </div>
        </div>
      </div>
    )
  }
}
Pool.propTypes = {
  pool: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  onStart: PropTypes.func.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default withRouter(connect(
  (state) => ({
    icons: state.icons,
    visibility: state.visibility,
  }),
  (dispatch, { pool }) => ({
    onStart: () => dispatch(startPool({ poolId: pool.get('id') })),
  })
)(Pool))
