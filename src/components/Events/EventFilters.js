import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { enumMsg, withMsg } from '_/intl'
import { saveEventFilters } from '_/actions'
import { localeCompare, toJS } from '_/helpers'
import moment from 'moment'

import { Filters } from '_/components/Toolbar'

export const SEVERITY = 'severity'
export const DATE = 'date'
export const MESSAGE = 'message'
export const UNKNOWN = 'unknown'

export const EVENT_SEVERITY = {
  error: 3,
  warning: 2,
  normal: 1,
  [UNKNOWN]: 0,
}

export function filterEvents ({ events, severityFilters, dateFilters, messageFilters }) {
  return events?.filter(({ severity, time, description }) => {
    const ackFromSeverity = !severityFilters?.length || severityFilters?.some(level => level === severity)
    const ackFromTime = !dateFilters?.length || dateFilters?.some(isoDateStr => moment(time).isSame(isoDateStr, 'day'))
    const ackFromMessage = !messageFilters?.length || messageFilters?.some(str => description?.includes(str))
    return ackFromSeverity && ackFromTime && ackFromMessage
  })
}

const composeSeverity = (msg, locale) => {
  return {
    id: SEVERITY,
    title: msg.severity(),
    placeholder: msg.eventsFilterTypePlaceholderSeverity(),
    filterValues: Object.entries(
      Object.keys(EVENT_SEVERITY)
        .map((status) => ({ title: enumMsg('EventSeverity', status, msg), id: status }))
        .reduce((acc, { title, id }) => {
          acc[title] = { ...acc[title], [id]: id }
          return acc
        }, {}))
      .map(([title, ids]) => ({ title, ids }))
      .sort((a, b) => localeCompare(a.title, b.title, locale)),
  }
}

const EventFilters = ({ msg, locale, selectedFilters = {}, onFilterUpdate }) => {
  const filterTypes = useMemo(() => [
    composeSeverity(msg, locale),
    {
      id: DATE,
      title: msg.date(),
      datePicker: true,
    },
    {
      id: MESSAGE,
      title: msg.message(),
      placeholder: msg.eventsFilterTypePlaceholderMessage(),
    },
  ], [msg, locale])
  return (
    <Filters
      selectedFilters={selectedFilters}
      onFilterUpdate={onFilterUpdate}
      filterTypes={filterTypes}
      textBasedFilterId={MESSAGE}
    />
  )
}

EventFilters.propTypes = {
  selectedFilters: PropTypes.object,
  onFilterUpdate: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  ({ userMessages }) => ({
    selectedFilters: toJS(userMessages.get('eventFilters')),
  }),
  (dispatch) => ({
    onFilterUpdate: (filters) => dispatch(saveEventFilters({ filters })),
  })
)(withMsg(EventFilters))
