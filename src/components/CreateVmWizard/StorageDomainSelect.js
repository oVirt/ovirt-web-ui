import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Select, SelectOption, SelectVariant } from '@patternfly/react-core'

const StorageDomainSelect = ({ items = [], selectedId, onChange, validated, id, isDisabled, placeholderText }) => {
  const [open, setOpen] = useState(false)
  const options = items.map(({ id, usage, value }) => ({ id, usage, toString: () => value }))
  const selectedOption = options.find(option => option.id === selectedId)

  const onSelect = (event, { id = '_' } = {}, isPlaceholder) => {
    if (!isPlaceholder) {
      setOpen(false)
      onChange(id)
    }
  }
  return (
    <>
      <Select
        id={id}
        variant={SelectVariant.single}
        onToggle={setOpen}
        onSelect={onSelect}
        selections={selectedOption}
        isOpen={open}
        isDisabled={isDisabled}
        validated={validated}
        placeholderText={placeholderText}
      >
        {options.map((option) => (
          <SelectOption
            key={option.id}
            value={option}
            description={option.usage ? option.usage : undefined}
          />
        ))}
      </Select>
    </>
  )
}

StorageDomainSelect.propTypes = {
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // id of a selected item, false-ish for the first item
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.string,
    usage: PropTypes.string,
  })).isRequired, // Array<{ id: string, value: string }>, order matters if sort is false-ish
  onChange: PropTypes.func.isRequired, // (selectedId: string) => any
  id: PropTypes.string,
  validated: PropTypes.oneOf(['default', 'error']),
  isDisabled: PropTypes.bool,
  placeholderText: PropTypes.string,
}

export default StorageDomainSelect
