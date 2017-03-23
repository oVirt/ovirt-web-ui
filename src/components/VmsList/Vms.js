import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './style.css'
import Vm from './Vm'

import { closeDetail } from '../../actions'

const Vms = ({ vms, visibility, onCloseDetail }) => {
  const isDetailVisible = visibility.get('selectedVmDetail') || visibility.get('showOptions')
  const containerClass = ['container-fluid', 'container-cards-pf', style['movable-left'],
    isDetailVisible ? style['moved-left'] : ''].join(' ')

  const closeDetail = isDetailVisible
    ? (event) => {
      onCloseDetail()
      event.stopPropagation()
    }
    : undefined

  return (
    <div onClickCapture={closeDetail}>
      <div className={containerClass}>
        <div className={style['scrollingWrapper']}>
          <div className='row row-cards-pf'>
            {vms.get('vms').toList().map(vm =>
              <Vm vm={vm} key={vm.get('id')} />)}
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
    onCloseDetail: () => dispatch(closeDetail()),
  })
)(Vms)
