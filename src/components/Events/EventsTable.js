import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'

import {
  TableComposable,
  Tbody,
  Th,
  Thead,
  Td,
  Tr,
} from '@patternfly/react-table'

import {
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner,
  Title,
} from '@patternfly/react-core'

import {
  SearchIcon,
} from '@patternfly/react-icons/dist/esm/icons'

import { EventStatus } from './EventStatus'

import style from './style.css'
import { localeCompare, toJS, translate } from '_/helpers'

import { saveEventFilters, setEventSort } from '_/actions'

import { SEVERITY, DATE, MESSAGE, EVENT_SEVERITY, UNKNOWN, filterEvents } from './EventFilters'

import { SortFields } from './EventSort'

const sortEvents = (events = [], { id, isAsc } = {}, locale) => {
  if (!id) {
    return
  }
  const direction = isAsc ? 1 : -1
  const getField = (event, id) => {
    switch (id) {
      case SEVERITY:
        return '' + EVENT_SEVERITY[event?.severity ?? UNKNOWN] ?? EVENT_SEVERITY[UNKNOWN]
      case DATE:
        return '' + event?.time ?? ''
      case MESSAGE:
        return event?.description
    }
  }

  events.sort((a, b) => direction * localeCompare(getField(a, id), getField(b, id), locale))
}

const EventsTable = ({
  msg,
  locale,
  events,
  eventFilters: { [SEVERITY]: severityFilters, [DATE]: dateFilters, [MESSAGE]: messageFilters },
  eventSort = { id: DATE },
  clearAllFilters,
  setSort,
}) => {
  const columns = [
    SortFields[SEVERITY],
    SortFields[DATE],
    SortFields[MESSAGE],
  ].map(({ messageDescriptor, ...rest }) => ({
    ...rest,
    messageDescriptor,
    label: messageDescriptor?.id ? translate({ id: messageDescriptor?.id, msg }) : '',
  }))

  const activeSortIndex = columns.findIndex(({ id }) => id === eventSort.id)
  const activeSortDirection = eventSort.isAsc ? 'asc' : 'desc'
  const buildSort = (columnIndex) => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: (_event, index, direction) => {
      setSort({
        isAsc: direction === 'asc',
        ...SortFields?.[columns[index]?.id ?? SEVERITY],
      })
    },
    columnIndex,
  })

  const filteredEvents = filterEvents({ events, severityFilters, dateFilters, messageFilters })

  sortEvents(filteredEvents, eventSort, locale)

  return (
    <div className={style.container}>
      { !filteredEvents && (
        <EmptyState variant="xl" isFullHeight>
          <EmptyStateIcon variant="container" component={Spinner} />
        </EmptyState>
      ) }

      { filteredEvents?.length === 0 && (
        <EmptyState variant="xl" isFullHeight>
          <EmptyStateIcon icon={SearchIcon} />
          <Title size="lg" headingLevel="h4">
            {msg.noEventsFound()}
          </Title>
          <EmptyStateBody>{msg.clearAllFiltersAndTryAgain()}</EmptyStateBody>
          <Button variant="link" onClick={clearAllFilters}>{msg.clearAllFilters()}</Button>
        </EmptyState>
      ) }

      { filteredEvents?.length > 0 && (
        <TableComposable
          aria-label={msg.events()}
          variant='compact'
          isStriped
          isStickyHeader
        >
          <Thead>
            <Tr>
              {columns.map(({ label }, index) => (
                <Th
                  key={index}
                  sort={buildSort(index)}
                >
                  {label}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredEvents.map(({ id, severity, time, description }) => (
              <Tr key={id}>
                <Td dataLabel={columns[0]?.label}>
                  <EventStatus severity={severity}/>
                </Td>
                <Td dataLabel={columns[1]?.label} modifier="nowrap" >
                  {new Date(time).toLocaleString(locale)}
                </Td>
                <Td dataLabel={columns[2]?.label}>
                  {description}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </TableComposable>
      ) }
    </div>
  )
}

EventsTable.propTypes = {
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  events: PropTypes.array,
  eventFilters: PropTypes.object.isRequired,
  eventSort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    messageDescriptor: PropTypes.object.isRequired,
    isAsc: PropTypes.bool,
  }),
  clearAllFilters: PropTypes.func.isRequired,
  setSort: PropTypes.func.isRequired,

}

export default connect(
  ({ userMessages }, { vmId }) => ({
    events: toJS(userMessages.getIn(['events', vmId])),
    eventFilters: toJS(userMessages.getIn(['eventFilters'], {})),
    eventSort: toJS(userMessages.getIn(['eventSort'])),
  }),
  (dispatch) => ({
    clearAllFilters: () => dispatch(saveEventFilters({ filters: {} })),
    setSort: (sort) => dispatch(setEventSort({ sort })),
  })
)(withMsg(EventsTable))
