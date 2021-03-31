import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { MsgContext } from '_/intl'
import { getByPage } from '_/actions'
import { filterVms, sortFunction } from '_/utils'

import useInfiniteScroll from '@closeio/use-infinite-scroll'
import Vm from './Vm'
import Pool from './Pool'

import style from './style.css'

/**
 * Use Patternfly 'Single Select Card View' pattern to show every VM and Pool
 * available to the current user.
 */
const VmCardList = ({ vms, alwaysShowPoolCard, fetchMoreVmsAndPools }) => {
  const { msg, locale } = useContext(MsgContext)
  const sort = vms.get('sort').toJS()
  const filters = vms.get('filters').toJS()

  // Filter the VMs (1. apply the filter bar criteria, 2. only show Pool VMs if the Pool exists)
  const filteredVms = vms.get('vms')
    .filter(vm => filterVms(vm, filters, msg))
    .filter(vm => vm.getIn(['pool', 'id'], false) ? !!vms.getIn(['pools', vm.getIn(['pool', 'id'])], false) : true)
    .toList()
    .map(vm => vm.set('isVm', true))

  // Filter the Pools (only show a Pool card if the user can currently 'Take' a VM from it)
  const filteredPools = vms.get('pools')
    .filter(pool =>
      (alwaysShowPoolCard || (pool.get('vmsCount') < pool.get('maxUserVms') && pool.get('size') > 0)) &&
      filterVms(pool, filters, msg)
    )
    .toList()

  // Display the VMs and Pools together, sorted nicely
  const vmsAndPools = [ ...filteredVms, ...filteredPools ].sort(sortFunction(sort, locale, msg))

  // Handle the infinite scroll and pagination
  const hasMore = vms.get('vmsExpectMorePages') || vms.get('poolsExpectMorePages')
  const [ page, sentinelRef, scrollerRef ] = useInfiniteScroll({ hasMore, distance: 0 })

  useEffect(() => { // `refreshListPage` handles loading the first page of data
    if (page > 0) {
      fetchMoreVmsAndPools()
    }
  }, [ page ])

  useEffect(() => {
    if (!scrollerRef.current || !sentinelRef.current) {
      return
    }

    //
    // If a page fetch doesn't pull enough entities to push the sentinel out of view
    // underlying IntersectionObserver doesn't fire another event, and the scroller
    // gets stuck.  Manually check if the sentinel is in view, and if it is, fetch
    // more data.  The effect is only run when the `vms` part of the redux store is
    // updated.
    //
    const scrollRect = scrollerRef.current.getBoundingClientRect()
    const scrollVisibleTop = scrollRect.y
    const scrollVisibleBottom = scrollRect.y + scrollRect.height

    const sentinelRect = sentinelRef.current.getBoundingClientRect()
    const sentinelTop = sentinelRect.y
    const sentinelBottom = sentinelRect.y + sentinelRect.height

    const sentinelStillInView = sentinelBottom >= scrollVisibleTop && sentinelTop <= scrollVisibleBottom
    if (sentinelStillInView) {
      fetchMoreVmsAndPools()
    }
  }, [ vms, scrollerRef, sentinelRef ])

  return (
    <div className={style['scroll-container-wrapper']}>
      <div ref={scrollerRef} className={`container-fluid container-cards-pf ${style['scroll-container']}`}>
        <div className={`row row-cards-pf ${style['cards-container']}`}>
          {vmsAndPools.map(entity =>
            entity.get('isVm')
              ? <Vm vm={entity} key={entity.get('id')} />
              : <Pool pool={entity} key={entity.get('id')} />
          )}
        </div>
        {hasMore && <div ref={sentinelRef} className={style['infinite-scroll-sentinel']}>{msg.loadingTripleDot()}</div>}
      </div>
    </div>
  )
}
VmCardList.propTypes = {
  vms: PropTypes.object.isRequired,
  alwaysShowPoolCard: PropTypes.bool,
  fetchMoreVmsAndPools: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    alwaysShowPoolCard: !state.config.get('filter'),
  }),
  (dispatch) => ({
    fetchMoreVmsAndPools: () => dispatch(getByPage()),
  })
)(VmCardList)
