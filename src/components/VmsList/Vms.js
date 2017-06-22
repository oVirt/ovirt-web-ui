import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'
import Vm from './Vm'
import Pool from './Pool'
import ScrollPositionHistory from '../ScrollPositionHistory'
import { getByPage } from '../../actions/index'
import InfiniteScroll from 'react-infinite-scroller'

class Vms extends React.Component {
  constructor (props) {
    super(props)
    this.loadMore = this.loadMore.bind(this)
  }

  loadMore () {
    if (this.props.vms.get('changed')) {
      this.props.onUpdate(this.props.vms.get('page') + 1)
    }
  }

  render () {
    let { vms } = this.props
    const containerClass = ['container-fluid',
      'container-cards-pf',
      style['movable-left'],
      style['full-window'],
    ].join(' ')

    const sortFunction = (vmA, vmB) => vmA.get('name').localeCompare(vmB.get('name'))
    return (
      <InfiniteScroll
        loadMore={this.loadMore}
        hasMore={vms.get('changed')}
        loader={<div className={style['loaderBox']}><div className={style['loader']} /></div>}
      >
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
      </InfiniteScroll>
    )
  }
}
Vms.propTypes = {
  vms: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
    onUpdate: (page) => dispatch(getByPage({ page })),
  })
)(Vms)
