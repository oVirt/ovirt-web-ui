import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { withMsg } from '_/intl'
import {
  DatePicker,
  InputGroup,
  ToolbarFilter,
} from '@patternfly/react-core'

import moment from 'moment'

const DatePickerFilter = ({
  filterId,
  selectedFilters,
  showToolbarItem,
  title,
  onFilterUpdate,
  msg,
}) => {
  const dateFormat = moment.localeData().longDateFormat('L')
  const formatDate = date => moment(date).format(dateFormat)
  const parseDate = str => moment(str, dateFormat).toDate()
  const isValidDate = date => moment(date, dateFormat).isValid()
  const toISO = str => moment(str, dateFormat).format('YYYY-MM-DD')
  const fromISO = str => moment(str, 'YYYY-MM-DD').format(dateFormat)

  const [date, setDate] = useState(toISO(formatDate(Date.now())))

  const clearSingleDate = (option) => {
    console.warn('clearSingle ', option)
    const fixed = toISO(option)
    onFilterUpdate([...selectedFilters?.filter(d => d !== fixed)])
  }

  const onDateChange = (inputDate, newDate) => {
    if (isValidDate(inputDate)) {
      const fixed = toISO(inputDate)
      setDate(fixed)
      onFilterUpdate([...selectedFilters?.filter(d => d !== fixed), fixed])
    }
  }

  return (
    <ToolbarFilter
      key={filterId}
      chips={selectedFilters?.map(fromISO)}
      deleteChip={(category, option) => clearSingleDate(option)}
      deleteChipGroup={() => onFilterUpdate([])}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <InputGroup>
        <DatePicker
          value={fromISO(date)}
          dateFormat={formatDate }
          dateParse={parseDate}
          onChange={onDateChange}
          aria-label={msg.date()}
          buttonAriaLabel={msg.toggleDatePicker()}
          placeholder={dateFormat}
          invalidFormatText={msg.invalidDateFormat({ format: dateFormat })}
        />
      </InputGroup>
    </ToolbarFilter>
  )
}

DatePickerFilter.propTypes = {
  filterId: PropTypes.string.isRequired,
  selectedFilters: PropTypes.array.isRequired,
  showToolbarItem: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onFilterUpdate: PropTypes.func.isRequired,

  msg: PropTypes.object.isRequired,
}

export default withMsg(DatePickerFilter)
