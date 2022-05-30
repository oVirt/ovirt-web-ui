import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'

import {
  TableComposable,
  Tbody,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table'

import { toJS, translate } from '_/helpers'

import { saveEventFilters, setVmSort } from '_/actions'
import { NAME, SortFields } from '_/utils'

const TableView = ({
  msg,
  locale,
  children: rows,
  columns,
  sort,
  setSort,
}) => {
  const activeSortIndex = columns.findIndex(({ id }) => id === sort.id)
  const activeSortDirection = sort.isAsc ? 'asc' : 'desc'

  const buildSort = (columnIndex) => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: (_event, index, direction) => {
      setSort({
        isAsc: direction === 'asc',
        ...SortFields?.[columns[index]?.id ?? NAME],
      })
    },
    columnIndex,
  })
  return (
    <>
      { rows?.length > 0 && (
        <TableComposable
          aria-label={msg.virtualMachines()}
          variant='compact'
          isStriped
          isStickyHeader
        >
          <Thead>
            <Tr>
              {columns.map(({ messageDescriptor: { id } = {}, sort }, index) => (
                <Th
                  key={index}
                  sort={sort && buildSort(index)}
                >
                  {id ? translate({ id, msg }) : ''}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            { rows}
          </Tbody>
        </TableComposable>
      ) }
    </>
  )
}

TableView.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      messageDescriptor: PropTypes.object,
      sort: PropTypes.bool,
    })).isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  children: PropTypes.array.isRequired,
  sort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isAsc: PropTypes.bool,
  }),
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
    setSort: (sort) => dispatch(setVmSort({ sort })),
  })
)(withMsg(TableView))
