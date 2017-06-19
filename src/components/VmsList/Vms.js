import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'
import Vm from './Vm'
import Pool from './Pool'
import ScrollPositionHistory from '../ScrollPositionHistory'

const Vms = ({ vms }) => {
  const containerClass = ['container-fluid',
    'container-cards-pf',
    style['movable-left'],
    style['full-window'],
  ].join(' ')

  const sortFunction = (vmA, vmB) => vmA.get('name').localeCompare(vmB.get('name'))

  return (
    <div>
      <ScrollPositionHistory uniquePrefix='vms-list'>
        <div className={containerClass}>
          <div className={style['scrollingWrapper']}>
            <div className='row row-cards-pf'>
              {vms.get('vms').toList()
                .sort(sortFunction)
                .map(vm => <Vm vm={vm} key={vm.get('id')} />)}
              {vms.get('pools').toList()// TODO: sort vms and pools together!
                .sort(sortFunction)
                .map(pool => {
                  if (pool.get('vmsCount') < pool.get('maxUserVms') && pool.get('size') > 0) {
                    return <Pool pool={pool} key={pool.get('id')} />
                  } else {
                    return null
                  }
                })}
            </div>
            <div className={style['overlay']} />
          </div>
        </div>
      </ScrollPositionHistory>
    </div>
  )
}
Vms.propTypes = {
  vms: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
  })
)(Vms)
