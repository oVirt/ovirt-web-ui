import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'
import Vm from './Vm'
import Pool from './Pool'

import { closeDialog } from '../../actions/index'
import { closeAllConfirmationComponents } from '../Confirmation'

const Vms = ({ vms, visibility, onCloseDetail }) => {
  const isDetailVisible = !!visibility.get('dialogToShow')
  const containerClass = ['container-fluid',
    'container-cards-pf',
    style['movable-left'],
    style['max-window-height'],
    isDetailVisible ? style['moved-left'] : '',
  ].join(' ')

  const closeDetail = isDetailVisible
    ? (event) => {
      closeAllConfirmationComponents()
      onCloseDetail()
      event.stopPropagation()
    }
    : undefined

  const sortFunction = (vmA, vmB) => vmA.get('name').localeCompare(vmB.get('name'))

  return (
    <div onClickCapture={closeDetail}>
      <div className={containerClass}>
        <div className={style['scrollingWrapper']}>
          <div className='row row-cards-pf'>
            {vms.get('vms').toList()
              .sort(sortFunction)
              .map(vm => <Vm vm={vm} key={vm.get('id')} />)}
            {vms.get('pools').toList()
              .sort(sortFunction)
              .map(pool => {
                if (pool.get('vmsCount') < pool.get('maxUserVms')) {
                  return <Pool pool={pool} key={pool.get('id')} />
                } else {
                  return null
                }
              })}
          </div>
          <div className={style['overlay']} />
        </div>
      </div>
    </div>
  )
}
Vms.propTypes = {
  vms: PropTypes.object.isRequired,
  visibility: PropTypes.object.isRequired,
  onCloseDetail: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    visibility: state.visibility,
  }),
  (dispatch) => ({
    onCloseDetail: () => dispatch(closeDialog({ force: false })),
  })
)(Vms)
