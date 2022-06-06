import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Sort from './Sort'
import { SortFields } from '_/utils'
import { setVmSort } from '_/actions'
import { withMsg } from '_/intl'

const VmSort = ({ sort, onSortChange }) => <Sort sort={sort} onSortChange={onSortChange} SortFields={SortFields}/>

VmSort.propTypes = {
  sort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    messageDescriptor: PropTypes.object.isRequired,
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
)(withMsg(VmSort))
