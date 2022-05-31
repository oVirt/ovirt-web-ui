import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { sortedBy } from '_/helpers'

import { withMsg } from '_/intl'
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core'

const SelectBox = ({ msg, sort, items = [], locale, selected, onChange, validationState, id, disabled }) => {
  const [open, setOpen] = useState(false)
  if (sort) {
    sortedBy(items, 'value', locale)
  }
  const options = items.map(({ id, value: name, isDefault }) => ({ id, name, isDefault, toString: () => name }))
  const selectedId = selected ?? items?.[0]?.id ?? null
  const selectedOption = options.find(option => option.id === selectedId)

  const onSelect = (event, { id = '' } = {}, isPlaceholder) => {
    if (!isPlaceholder) {
      setOpen(false)
      onChange(id)
    }
  }
  return (
    <Select
      id={id}
      variant={SelectVariant.single}
      onToggle={setOpen}
      onSelect={onSelect}
      selections={selectedOption}
      isOpen={open}
      isDisabled={disabled}
      validated={validationState}
    >
      {options.map((option) => (
        <SelectOption
          key={option.id}
          value={option}
          description={option.isDefault ? msg.defaultOption() : undefined}
        />
      ))}
    </Select>
  )
}

SelectBox.propTypes = {
  selected: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // id of a selected item, false-ish for the first item
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.string,
    isDefault: PropTypes.bool,
  })).isRequired, // Array<{ id: string, value: string }>, order matters if sort is false-ish
  sort: PropTypes.bool, // sorted alphabetically by current locale with { numeric: true } if true
  onChange: PropTypes.func.isRequired, // (selectedId: string) => any
  id: PropTypes.string,
  validationState: PropTypes.oneOf([false, 'default', 'error']),
  disabled: PropTypes.bool,
  locale: PropTypes.string.isRequired,
  msg: PropTypes.object.isRequired,
}

export default withMsg(SelectBox)
