import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Sort } from '_/components/Toolbar'
import { setEventSort } from '_/actions'
import { withMsg } from '_/intl'
import { toJS } from '_/helpers'

import { SEVERITY, DATE, MESSAGE } from './EventFilters'

export const SortFields = {
  [SEVERITY]: {
    id: SEVERITY,
    messageDescriptor: { id: 'severity' },
  },
  [DATE]: {
    id: DATE,
    messageDescriptor: { id: 'date' },
  },
  [MESSAGE]: {
    id: MESSAGE,
    messageDescriptor: { id: 'message' },
  },
}

const EventSort = ({ sort = { ...SortFields[DATE], isAsc: false }, onSortChange }) => <Sort sort={sort} onSortChange={onSortChange} SortFields={SortFields}/>

EventSort.propTypes = {
  sort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    messageDescriptor: PropTypes.object.isRequired,
    isAsc: PropTypes.bool,
  }),
  onSortChange: PropTypes.func.isRequired,
}

export default connect(
  ({ userMessages }) => ({
    sort: toJS(userMessages.get('eventSort')),
  }),
  (dispatch) => ({
    onSortChange: (sort) => dispatch(setEventSort({ sort })),
  })
)(withMsg(EventSort))
