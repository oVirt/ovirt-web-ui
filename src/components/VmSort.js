import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Sort } from 'patternfly-react'

import { setVmSort } from '_/actions'
import { sortFields } from '_/utils'

class VmSort extends React.Component {
  constructor (props) {
    super(props)
    this.updateCurrentSortType = this.updateCurrentSortType.bind(this)
    this.toggleCurrentSortDirection = this.toggleCurrentSortDirection.bind(this)
  }

  updateCurrentSortType (sortType) {
    this.props.onSortChange({ ...sortType, isAsc: this.props.sort.get('isAsc') })
  }

  toggleCurrentSortDirection () {
    const sort = this.props.sort.toJS()
    this.props.onSortChange({ ...sort, isAsc: !this.props.sort.get('isAsc') })
  }

  render () {
    let { sort } = this.props
    sort = sort.toJS()

    return (
      <Sort>
        <Sort.TypeSelector
          sortTypes={sortFields}
          currentSortType={sort}
          onSortTypeSelected={this.updateCurrentSortType}
        />
        <Sort.DirectionSelector
          isAscending={sort.isAsc}
          isNumeric={sort.isNumeric}
          onClick={this.toggleCurrentSortDirection}
        />
      </Sort>
    )
  }
}

VmSort.propTypes = {
  sort: PropTypes.object.isRequired,
  onSortChange: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    sort: state.vms.get('sort'),
  }),
  (dispatch) => ({
    onSortChange: (sort) => dispatch(setVmSort({ sort })),
  })
)(VmSort)
