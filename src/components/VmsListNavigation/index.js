import React from 'react'
import PropTypes from 'prop-types'

import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { getByPage, getConsoleOptions, selectVmDetail } from '../../actions/index'
import InfiniteScroll from 'react-infinite-scroller'

import style from './style.css'

const VmsListNavigation = ({ selectedVm, vms, expanded, toggleExpansion, onUpdate, loadConsoleOptions, getVms }) => {
  const linkClick = (vmId) => {
    loadConsoleOptions(vmId)
    getVms(vmId)
  }

  const toggleExpandButton = (
    <div className={`${style['toggle-expand-button']} ${expanded ? style['toggle-expand-button-expanded'] : ''}`}>
      <a href='#' onClick={toggleExpansion}>
        <span className={`fa ${expanded ? 'fa-angle-double-left' : 'fa-angle-double-right'}`} />
      </a>
    </div>
  )

  const loadMore = () => {
    if (vms.get('notAllPagesLoaded')) {
      onUpdate(vms.get('page') + 1)
    }
  }

  const emptyList = (<div />)
  let list = null
  if (expanded) {
    const sortFunction = (vmA, vmB) => vmA.get('name').localeCompare(vmB.get('name'))
    list = (
      <ul className={`menu ${style['ul-menu-cust']}`} role='menu' aria-labelledby='dropdownMenu1'>
        {vms.get('vms').toList().sort(sortFunction).map(vm => {
          if (vm.get('id') === selectedVm.get('id')) { // is selected
            return (
              <li role='presentation' className={`${style['item']} ${style['item-selected']}`} key={vm.get('id')}>
                <span className={style['item-text']}>{vm.get('name')}</span>
              </li>
            )
          }

          return (
            <li role='presentation' className={style['item']} key={vm.get('id')}>
              <Link to={`/vm/${vm.get('id')}`} className={style['item-link']} onClick={() => { linkClick(vm.get('id')) }}>
                <span className={style['item-text']}>{vm.get('name')}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className={`${style['main-container']} ${expanded ? style['expanded'] : ''}`}>
      {toggleExpandButton}
      <div className={style['scrolling-viewport']}>
        <InfiniteScroll
          loadMore={loadMore}
          hasMore={vms.get('notAllPagesLoaded')}
          useWindow={false}
          >
          {list || emptyList}
        </InfiniteScroll>
      </div>
    </div>
  )
}
VmsListNavigation.propTypes = {
  selectedVm: PropTypes.object.isRequired,
  vms: PropTypes.object.isRequired,
  expanded: PropTypes.bool,

  getVms: PropTypes.func.isRequired,
  toggleExpansion: PropTypes.func.isRequired,
  loadConsoleOptions: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
    loadConsoleOptions: (vmId) => dispatch(getConsoleOptions({ vmId })),
    onUpdate: (page) => dispatch(getByPage({ page })),
    getVms: (vmId) => dispatch(selectVmDetail({ vmId })),
  })
)(VmsListNavigation)
