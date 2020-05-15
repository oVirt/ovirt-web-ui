import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'
import Vm from './Vm'
import Pool from './Pool'
import ScrollPositionHistory from '../ScrollPositionHistory'
import { getByPage } from '_/actions'
import { filterVms, sortFunction } from '_/utils'
import InfiniteScroll from 'react-infinite-scroller'
import Loader, { SIZES } from '../Loader'

/**
 * Use Patternfly 'Single Select Card View' pattern to show every VM and Pool
 * available to the current user.
 */
class Vms extends React.Component {
  constructor (props) {
    super(props)
    this.loadMore = this.loadMore.bind(this)
  }

  loadMore (scrollPage) {
    if (this.props.vms.get('notAllPagesLoaded')) {
      this.props.fetchPage(this.props.vms.get('page') + 1)
    }
  }

  render () {
    const { vms, alwaysShowPoolCard } = this.props

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
      .filter(pool => (alwaysShowPoolCard || (pool.get('vmsCount') < pool.get('maxUserVms') && pool.get('size') > 0)) && filterVms(pool, filters))
      .toList()

    // Display the VMs and Pools together, sorted nicely
    const vmsAndPools = [ ...filteredVms, ...filteredPools ].sort(sortFunction(sort))

    const hasMore = vms.get('notAllPagesLoaded')

    return (
      <InfiniteScroll
        loadMore={this.loadMore}
        isReverse={!sort.isAsc}
        hasMore={hasMore}
        loader={<Loader key='infinite-scroll-loader' size={SIZES.LARGE} />}
        useWindow={false}
      >
        <ScrollPositionHistory uniquePrefix='vms-list' scrollContainerSelector='#page-router-render-component'>
          <div className='container-fluid container-cards-pf'>
            <div className={`row row-cards-pf ${style['cards-container']}`}>
              {vmsAndPools.map(instance =>
                instance.get('isVm')
                  ? <Vm vm={instance} key={instance.get('id')} />
                  : <Pool pool={instance} key={instance.get('id')} />
              )}
            </div>
            <div className={style['overlay']} />
          </div>
        </ScrollPositionHistory>
      </InfiniteScroll>
    )
  }
}
Vms.propTypes = {
  vms: PropTypes.object.isRequired,
  alwaysShowPoolCard: PropTypes.bool,
  fetchPage: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    alwaysShowPoolCard: !state.config.get('filter'),
  }),
  (dispatch) => ({
    fetchPage: (page) => dispatch(getByPage({ page })),
  })
)(Vms)
