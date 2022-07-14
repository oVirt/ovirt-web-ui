import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import style from './style.css'
import { getByPage } from '_/actions'
import useInfiniteScroll from '@closeio/use-infinite-scroll'
import {
  filterVms,
  sortFunction,
} from '_/utils'

import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
} from '@patternfly/react-core'
import VmCardList from './VmCardList'
import { MsgContext, withMsg } from '_/intl'
import { AddCircleOIcon } from '@patternfly/react-icons/dist/esm/icons'
import TableView from './TableView'

/**
 * Component displayed when VMs or Pools exist but the data is still loading.
 */
const VmLoading = () => {
  return <div />
}

/**
 * Component displayed when no VMs or Pools could be loaded for the current user.
 */
const NoVmAvailable = () => {
  const { msg } = useContext(MsgContext)
  const idPrefix = 'no-vm'
  return (
    <EmptyState>
      <EmptyStateIcon id={`${idPrefix}-icon` } icon={AddCircleOIcon}/>
      <Title id={`${idPrefix}-title`} headingLevel="h4" size="lg">
        {msg.noVmAvailable()}
      </Title>
      <EmptyStateBody id={`${idPrefix}-text`}>{msg.noVmAvailableForLoggedUser()}</EmptyStateBody>
    </EmptyState>
  )
}

const InfiniteScroller = ({ children, className, fetchMoreVmsAndPools, vms }) => {
  const { msg } = useContext(MsgContext)
  // Handle the infinite scroll and pagination
  const hasMore = vms.get('vmsExpectMorePages') || vms.get('poolsExpectMorePages')
  const [page, sentinelRef, scrollerRef] = useInfiniteScroll({ hasMore, distance: 0 })

  useEffect(() => { // `VmsList` will not display this component until the first page of data is loaded
    if (page > 0) {
      fetchMoreVmsAndPools()
    }
  }, [page, fetchMoreVmsAndPools])

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
  }, [vms, scrollerRef, sentinelRef, fetchMoreVmsAndPools])

  return (
    <div ref={scrollerRef} className={className}>
      {children}
      {hasMore && <div ref={sentinelRef} className={style['infinite-scroll-sentinel']}>{msg.loadingTripleDot()}</div>}
    </div>
  )
}

InfiniteScroller.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  fetchMoreVmsAndPools: PropTypes.func.isRequired,
  vms: PropTypes.object.isRequired,
}

const VmsList = ({
  alwaysShowPoolCard,
  fetchMoreVmsAndPools,
  tableView,
  vms,
  waitForFirstFetch,
  msg,
  locale,
}) => {
  const haveVms = (vms.get('vms') && !vms.get('vms').isEmpty())
  const havePools = (vms.get('pools') && !vms.get('pools').isEmpty())

  if (waitForFirstFetch) {
    return <VmLoading />
  }

  if (!haveVms && !havePools) {
    <NoVmAvailable />
  }

  const sort = vms.get('sort').toJS()
  const filters = vms.get('filters').toJS()

  // Filter the VMs (1. apply the filter bar criteria, 2. only show Pool VMs if the Pool exists)
  const filteredVms = vms.get('vms')
    .filter(vm => filterVms(vm, filters))
    .filter(vm => vm.getIn(['pool', 'id'], false) ? !!vms.getIn(['pools', vm.getIn(['pool', 'id'])], false) : true)
    .toList()
    .map(vm => vm.set('isVm', true))

  // Filter the Pools (only show a Pool card if the user can currently 'Take' a VM from it)
  const filteredPools = vms.get('pools')
    .filter(pool =>
      (alwaysShowPoolCard || (pool.get('vmsCount') < pool.get('maxUserVms') && pool.get('size') > 0)) &&
      filterVms(pool, filters)
    )
    .toList()

  // Display the VMs and Pools together, sorted nicely
  const vmsAndPools = [...filteredVms, ...filteredPools].sort(sortFunction(sort, locale, msg))

  return (
    <InfiniteScroller
      className={tableView ? style.tableView : ''}
      fetchMoreVmsAndPools={fetchMoreVmsAndPools}
      vms={vms}
    >
      {tableView && <TableView vmsAndPools={vmsAndPools} sort={sort}/>}
      {!tableView && <VmCardList vmsAndPools={vmsAndPools}/>}
    </InfiniteScroller>
  )
}
VmsList.propTypes = {
  alwaysShowPoolCard: PropTypes.bool,
  fetchMoreVmsAndPools: PropTypes.func.isRequired,
  tableView: PropTypes.bool.isRequired,
  vms: PropTypes.object.isRequired,
  waitForFirstFetch: PropTypes.bool.isRequired,

  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default withRouter(connect(
  ({ vms, config, options }) => ({
    vms,
    alwaysShowPoolCard: !config.get('filter'),
    tableView: options.getIn(['remoteOptions', 'viewForVirtualMachines', 'content']) === 'table',
    waitForFirstFetch: (
      vms.get('vmsPage') === 0 && !!vms.get('vmsExpectMorePages') &&
      vms.get('poolsPage') === 0 && !!vms.get('poolsExpectMorePages')
    ),
  }),
  (dispatch) => ({
    fetchMoreVmsAndPools: () => dispatch(getByPage()),
  })
)(withMsg(VmsList)))
