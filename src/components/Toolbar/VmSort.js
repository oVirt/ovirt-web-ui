import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Sort } from 'patternfly-react'

import { setVmSort } from '_/actions'
import { SortFields } from '_/utils'
import { Tooltip } from '_/components/tooltips'
import { withMsg } from '_/intl'
import { translate } from '_/helpers'

class VmSort extends React.Component {
  constructor (props) {
    super(props)
    this.updateCurrentSortType = this.updateCurrentSortType.bind(this)
    this.toggleCurrentSortDirection = this.toggleCurrentSortDirection.bind(this)
    this.getSortTooltipMessage = this.getSortTooltipMessage.bind(this)
  }

  updateCurrentSortType (sortType) {
    this.props.onSortChange({ ...sortType, isAsc: this.props.sort.isAsc })
  }

  toggleCurrentSortDirection () {
    const sort = this.props.sort
    this.props.onSortChange({ ...sort, isAsc: !sort.isAsc })
  }

  getSortTooltipMessage () {
    const { msg } = this.props
    const { sort: { id, isAsc } } = this.props
    return id === 'os' || id === 'name'
      ? (isAsc ? msg.sortAToZ() : msg.sortZToA())
      : (isAsc ? msg.sortOffFirst() : msg.sortRunningFirst())
  }

  render () {
    const { sort, msg } = this.props

    return (
      <Sort>
        <Sort.TypeSelector
          sortTypes={Object.values(SortFields).map(type => ({ ...type, title: translate({ ...type.messageDescriptor, msg }) }))}
          currentSortType={sort && { ...sort, title: translate({ ...sort.messageDescriptor, msg }) }}
          onSortTypeSelected={this.updateCurrentSortType}
        />
        <Tooltip
          id={'sort-tooltip'}
          tooltip={this.getSortTooltipMessage()}
          placement={'bottom'}
        >
          <Sort.DirectionSelector
            isAscending={sort.isAsc}
            isNumeric={sort.isNumeric}
            onClick={this.toggleCurrentSortDirection}
          />
        </Tooltip>
      </Sort>
    )
  }
}

VmSort.propTypes = {
  sort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    messageDescriptor: PropTypes.object.isRequired,
    isNumeric: PropTypes.bool,
    isAsc: PropTypes.bool,
  }).isRequired,
  onSortChange: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    sort: state.vms.get('sort').toJS(),
  }),
  (dispatch) => ({
    onSortChange: (sort) => dispatch(setVmSort({ sort })),
  })
)(withMsg(VmSort))
