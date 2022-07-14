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

import { translate } from '_/helpers'

import { setVmSort } from '_/actions'
import {
  SortFields,
  ICON,
  POOL_INFO,
  ACTIONS,
  NAME,
  OS,
  STATUS,
} from '_/utils'

import {
  TableVm,
} from './Vm'
import {
  TablePool,
} from './Pool'

const TableView = ({
  msg,
  locale,
  vmsAndPools,
  sort,
  setSort,
}) => {
  const columns = [
    { id: ICON },
    {
      ...SortFields[NAME],
      sort: true,
    },
    {
      ...SortFields[STATUS],
      sort: true,
    },
    { id: POOL_INFO },
    {
      ...SortFields[OS],
      sort: true,
    },
    { id: ACTIONS },
  ]

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
      { vmsAndPools?.length > 0 && (
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
            { vmsAndPools.map(entity => (
              entity.get('isVm')
                ? (
                  <TableVm
                    columns={columns}
                    key={entity.get('id')}
                    vm={entity}
                  />
                )
                : (
                  <TablePool
                    columns={columns}
                    key={entity.get('id')}
                    pool={entity}
                  />
                )
            ))}
          </Tbody>
        </TableComposable>
      ) }
    </>
  )
}

TableView.propTypes = {
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  vmsAndPools: PropTypes.array.isRequired,
  sort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isAsc: PropTypes.bool,
  }),
  setSort: PropTypes.func.isRequired,
}

export default connect(
  null,
  (dispatch) => ({
    setSort: (sort) => dispatch(setVmSort({ sort })),
  })
)(withMsg(TableView))
