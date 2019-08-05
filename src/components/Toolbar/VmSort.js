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
    this.props.onSortChange({ ...sortType, isAsc: this.props.sort.isAsc })
  }

  toggleCurrentSortDirection () {
    const sort = this.props.sort
    this.props.onSortChange({ ...sort, isAsc: !sort.isAsc })
  }

  render () {
    const { sort } = this.props

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
  sort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    isNumeric: PropTypes.bool,
    isAsc: PropTypes.bool,
  }).isRequired,
  onSortChange: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    sort: state.vms.get('sort').toJS(),
  }),
  (dispatch) => ({
    onSortChange: (sort) => dispatch(setVmSort({ sort })),
  })
)(VmSort)
