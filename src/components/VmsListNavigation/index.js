import React from 'react'
import PropTypes from 'prop-types'

import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { getByPage } from '../../actions/index'
import InfiniteScroll from 'react-infinite-scroller'
import naturalCompare from 'string-natural-compare'

import style from './style.css'

const VmsListNavigation = ({ selectedVm, vms, expanded, toggleExpansion, loadAnotherPage }) => {
  const idPrefix = `vmslistnav`
  const toggleExpandButton = (
    <div className={`${style['toggle-expand-button']} ${expanded ? style['toggle-expand-button-expanded'] : ''}`}>
      <a href='#' onClick={toggleExpansion} id={`${idPrefix}-button-expand`}>
        <span className={`fa ${expanded ? 'fa-angle-double-left' : 'fa-angle-double-right'}`} />
      </a>
    </div>
  )

  const loadMore = () => {
    if (vms.get('notAllPagesLoaded')) {
      loadAnotherPage(vms.get('page') + 1)
    }
  }

  let list = null
  if (expanded) {
    const sortedVms = vms.get('vms')
      .sort((vmA, vmB) => naturalCompare.caseInsensitive(vmA.get('name'), vmB.get('name')))

    const items = sortedVms.map(vm => {
      if (vm.get('id') === selectedVm.get('id')) { // is selected
        return (
          <li role='presentation' className={`${style['item']} ${style['item-selected']}`} key={vm.get('id')}>
            <span className={style['item-text']} id={`${idPrefix}-item-${vm.get('name')}`}>{vm.get('name')}</span>
          </li>
        )
      }

      return (
        <li role='presentation' className={style['item']} key={vm.get('id')}>
          <Link to={`/vm-legacy/${vm.get('id')}`} className={style['item-link']}>
            <span className={style['item-text']} id={`${idPrefix}-item-${vm.get('name')}`}>{vm.get('name')}</span>
          </Link>
        </li>
      )
    }) // ImmutableJS OrderedMap

    list = (
      <ul className={`menu ${style['ul-menu-cust']}`} role='menu' aria-labelledby='dropdownMenu1'>
        {items.toArray()}
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
          {list || (<div />)}
        </InfiniteScroll>
      </div>
    </div>
  )
}
VmsListNavigation.propTypes = {
  selectedVm: PropTypes.object.isRequired,
  vms: PropTypes.object.isRequired,
  expanded: PropTypes.bool,

  toggleExpansion: PropTypes.func.isRequired,
  loadAnotherPage: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
    loadAnotherPage: (page) => dispatch(getByPage({ page })),
  })
)(VmsListNavigation)
