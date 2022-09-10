import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Select,
  SelectOption,
  SelectVariant,
  ToolbarFilter,
} from '@patternfly/react-core'

const SelectFilter = ({ filterIds = [], setFilters, allSupportedFilters = [], title, placeholderText, filterColumnId, showToolbarItem }) => {
  const [isExpanded, setExpanded] = useState(false)

  // one label can map to many IDs so it's easier work with labels
  // and reverse map label-to-IDs on save
  const toChip = ({ title }) => title
  const toOption = ({ title }) => title
  const toOptionNode = ({ title }) =>
    <SelectOption key={ title} value={title}/>

  // titles are guaranteed to be unique
  // return first filter with matching title
  const labelToIds = (title) => {
    const [{ ids = {} } = {}] = allSupportedFilters.filter(filter => filter.title === title) || []
    return ids
  }
  const selectedFilters = allSupportedFilters.filter(({ ids }) => filterIds.find(id => ids[id]))
  const deleteFilter = (title) => {
    const ids = labelToIds(title)
    // delete all filter IDs linked to provided title
    setFilters(filterIds.filter(id => !ids[id]))
  }

  const addFilter = (title) => {
    const ids = labelToIds(title)
    // add all filter IDs linked
    setFilters([...filterIds, ...Object.keys(ids)])
  }

  const hasFilter = (title) => {
    const ids = labelToIds(title)
    return filterIds.some(id => ids[id])
  }
  return (
    <ToolbarFilter
      key={filterColumnId}
      chips={selectedFilters.map(toChip)}
      deleteChip={(category, option) => deleteFilter(option)}
      deleteChipGroup={() => setFilters([])}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <Select
        variant={SelectVariant.checkbox}
        aria-label={placeholderText}
        onSelect={(e, option, isPlaceholder) => {
          if (isPlaceholder) {
            return
          }
          hasFilter(option)
            ? deleteFilter(option)
            : addFilter(option)
        } }
        selections={selectedFilters.map(toOption)}
        placeholderText={placeholderText}
        isOpen={isExpanded}
        onToggle={setExpanded}
      >
        {allSupportedFilters.map(toOptionNode)}
      </Select>
    </ToolbarFilter>
  )
}

SelectFilter.propTypes = {
  filterIds: PropTypes.array.isRequired,
  allSupportedFilters: PropTypes.array.isRequired,
  setFilters: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  placeholderText: PropTypes.string.isRequired,
  filterColumnId: PropTypes.string.isRequired,
  showToolbarItem: PropTypes.bool.isRequired,
}

export default SelectFilter
