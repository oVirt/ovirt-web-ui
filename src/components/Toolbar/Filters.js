import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { withMsg } from '_/intl'
import {
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  InputGroup,
  TextInput,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarItem,
  ToolbarToggleGroup,
  Tooltip,
} from '@patternfly/react-core'

import { FilterIcon, SearchIcon } from '@patternfly/react-icons/dist/esm/icons'

import DatePickerFilter from './DatePickerFilter'
import SelectFilter from './SelectFilter'

const Filters = ({ msg, locale, selectedFilters, onFilterUpdate, filterTypes, textBasedFilterId }) => {
  const [currentFilterType, setCurrentFilterType] = useState(filterTypes[0])
  const [expanded, setExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const nameFilter = filterTypes.find(({ id }) => id === textBasedFilterId)
  const labelToFilter = (label) => filterTypes.find(({ title }) => title === label) ?? currentFilterType

  const onFilterTypeSelect = (event) => {
    setCurrentFilterType(labelToFilter(event?.target?.innerText))
    setExpanded(!expanded)
  }
  const onFilterTypeToggle = () => setExpanded(!expanded)
  const onNameInput = (event) => {
    if ((event.key && event.key !== 'Enter') ||
     !inputValue ||
      selectedFilters?.[textBasedFilterId]?.includes(inputValue)) {
      return
    }
    onFilterUpdate({ ...selectedFilters, [textBasedFilterId]: [...(selectedFilters?.[textBasedFilterId] ?? []), inputValue] })
    setInputValue('')
  }

  return (
    <ToolbarToggleGroup toggleIcon={<Tooltip content={msg.filter()}><FilterIcon /></Tooltip>} breakpoint="xl">
      <ToolbarGroup variant="filter-group">
        <ToolbarItem>
          <Dropdown
            onSelect={onFilterTypeSelect}
            position={DropdownPosition.left}
            toggle={(
              <DropdownToggle onToggle={onFilterTypeToggle} style={{ width: '100%' }}>
                <FilterIcon /> {currentFilterType.title}
              </DropdownToggle>
            )}
            isOpen={expanded}
            style={{ width: '100%' }}
            dropdownItems={
          filterTypes.map(({ id, title }) =>
            <DropdownItem key={id}>{title}</DropdownItem>)
          }
          />
        </ToolbarItem>
        <ToolbarFilter
          key={textBasedFilterId}
          chips={selectedFilters?.[textBasedFilterId] ?? [] }
          deleteChip={(category, option) => onFilterUpdate({
            ...selectedFilters,
            [textBasedFilterId]: selectedFilters?.[textBasedFilterId]?.filter?.(value => value !== option) ?? [],
          })}
          deleteChipGroup={() => onFilterUpdate({ ...selectedFilters, [textBasedFilterId]: [] })}
          categoryName={nameFilter.title}
          showToolbarItem={currentFilterType.id === textBasedFilterId}
        >
          <InputGroup>
            <TextInput
              id={textBasedFilterId}
              type="search"
              onChange={setInputValue}
              value={inputValue}
              placeholder={nameFilter.placeholder}
              onKeyDown={onNameInput}
            />
            <Button
              variant={ButtonVariant.control}
              aria-label={msg.vmFilterTypePlaceholderName()}
              onClick={onNameInput}
            >
              <SearchIcon />
            </Button>
          </InputGroup>
        </ToolbarFilter>
        {
          filterTypes.filter(({ datePicker }) => datePicker).map(({ id: filterId, title }) => (
            <DatePickerFilter
              title={title}
              key={filterId}
              selectedFilters={selectedFilters?.[filterId] ?? []}
              filterId={filterId}
              showToolbarItem={currentFilterType.id === filterId}
              onFilterUpdate={(filtersToSave) => {
                console.warn('filtersToSave', filtersToSave)
                onFilterUpdate({ ...selectedFilters, [filterId]: filtersToSave })
              }
              }
            />
          ))
        }
        {filterTypes.filter(({ filterValues }) => !!filterValues?.length)
          ?.map(({ id, filterValues, placeholder, title }) => (
            <SelectFilter
              title={title}
              key={id}
              filterColumnId={id}
              showToolbarItem={currentFilterType.id === id}
              filterIds={selectedFilters?.[id] ?? []}
              allSupportedFilters={filterValues}
              setFilters={(filtersToSave) => onFilterUpdate({ ...selectedFilters, [id]: filtersToSave })}
              title={title}
              placeholderText={placeholder}
            />
          )
          )}
      </ToolbarGroup>
    </ToolbarToggleGroup>
  )
}

Filters.propTypes = {
  selectedFilters: PropTypes.object.isRequired,
  filterTypes: PropTypes.array.isRequired,
  textBasedFilterId: PropTypes.string.isRequired,
  onFilterUpdate: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default withMsg(Filters)
