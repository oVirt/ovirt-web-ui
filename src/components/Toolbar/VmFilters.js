import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { enumMsg, withMsg } from '_/intl'
import { saveVmsFilters } from '_/actions'
import { localeCompare, toJS } from '_/helpers'
import {
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  InputGroup,
  Select,
  SelectOption,
  SelectVariant,
  TextInput,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarItem,
  ToolbarToggleGroup,
} from '@patternfly/react-core'

import { FilterIcon, SearchIcon } from '@patternfly/react-icons/dist/esm/icons'

const STATUS = 'status'
const OS = 'os'
const NAME = 'name'

const composeStatus = (msg, locale) => {
  const statuses = [
    'up',
    'powering_up',
    'down',
    'paused',
    'suspended',
    'powering_down',
    'not_responding',
    'unknown',
    'unassigned',
    'migrating',
    'wait_for_launch',
    'reboot_in_progress',
    'saving_state',
    'restoring_state',
    'image_locked',
  ]
  return {
    id: STATUS,
    title: msg.status(),
    placeholder: msg.vmFilterTypePlaceholderStatus(),
    filterValues: Object.entries(statuses
      .map((status) => ({ title: enumMsg('VmStatus', status, msg), id: status }))
      .reduce((acc, { title, id }) => {
        acc[title] = { ...acc[title], [id]: id }
        return acc
      }, {}))
      .map(([title, ids]) => ({ title, ids }))
      .sort((a, b) => localeCompare(a.title, b.title, locale)),
  }
}

const composeOs = (msg, locale, operatingSystems) => {
  return ({
    id: OS,
    title: msg.operatingSystem(),
    placeholder: msg.vmFilterTypePlaceholderOS(),
    filterValues: Object.entries(operatingSystems
      .toList().toJS()
    // { name: 'other_linux_ppc64', description: 'Linux'},  {description: 'Linux', name: 'other_linux'}
    // {title: 'Linux', ids: {'other_linux_ppc64', 'other_linux'}
      .reduce((acc, { name, description }) => {
        acc[description] = { ...acc[description], [name]: name }
        return acc
      }, {}))
      .map(([description, ids]) => ({ title: description, ids }))
      .sort((a, b) => localeCompare(a.title, b.title, locale)),
  })
}

const Filter = ({ filterIds = [], setFilters, allSupportedFilters = [], title, filterColumnId, showToolbarItem }) => {
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
  return (
    <ToolbarFilter
      key={filterColumnId}
      chips={selectedFilters.map(toChip)}
      deleteChip={(category, option) => deleteFilter(option)}
      deleteChipGroup={() => setFilters([])}
      categoryName={filterColumnId}
      showToolbarItem={showToolbarItem}
    >
      <Select
        variant={SelectVariant.checkbox}
        aria-label={title}
        onSelect={(e, option, isPlaceholder) => {
          if (isPlaceholder) {
            return
          }
          event?.target?.checked
            ? addFilter(option)
            : deleteFilter(option)
        } }
        selections={selectedFilters.map(toOption)}
        placeholderText={title}
        isOpen={isExpanded}
        onToggle={setExpanded}
      >
        {allSupportedFilters.map(toOptionNode)}
      </Select>
    </ToolbarFilter>
  )
}

Filter.propTypes = {
  filterIds: PropTypes.array.isRequired,
  allSupportedFilters: PropTypes.array.isRequired,
  setFilters: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  filterColumnId: PropTypes.string.isRequired,
  showToolbarItem: PropTypes.bool.isRequired,
}

const VmFilters = ({ msg, locale, operatingSystems, selectedFilters, onFilterUpdate }) => {
  const filterTypes = useMemo(() => [
    {
      id: NAME,
      title: msg.name(),
      placeholder: msg.vmFilterTypePlaceholderName(),
    },
    composeStatus(msg, locale),
    composeOs(msg, locale, operatingSystems),
  ], [msg, locale, operatingSystems])
  const [currentFilterType, setCurrentFilterType] = useState(filterTypes[0])
  const [expanded, setExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const nameFilter = filterTypes.find(({ id }) => id === NAME)
  const labelToFilter = (label) => filterTypes.find(({ title }) => title === label) ?? currentFilterType

  const onFilterTypeSelect = (event) => {
    setCurrentFilterType(labelToFilter(event?.target?.innerText))
    setExpanded(!expanded)
  }
  const onFilterTypeToggle = () => setExpanded(!expanded)
  const onNameInput = (event) => {
    if ((event.key && event.key !== 'Enter') ||
     !inputValue ||
      selectedFilters?.[NAME]?.includes(inputValue)) {
      return
    }
    onFilterUpdate({ ...selectedFilters, [NAME]: [...(selectedFilters?.[NAME] ?? []), inputValue] })
    setInputValue('')
  }

  return (
    <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
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
          key={NAME}
          chips={selectedFilters?.[NAME] ?? [] }
          deleteChip={(category, option) => onFilterUpdate({
            ...selectedFilters,
            [NAME]: selectedFilters?.[NAME]?.filter?.(value => value !== option) ?? [],
          })}
          deleteChipGroup={() => onFilterUpdate({ ...selectedFilters, [NAME]: [] })}
          categoryName={NAME}
          showToolbarItem={currentFilterType.id === NAME}
        >
          <InputGroup>
            <TextInput
              id="name"
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
        {filterTypes.filter(({ id }) => id !== NAME)?.map(({ id, filterValues, placeholder }) => (
          <Filter
            key={id}
            filterColumnId={id}
            showToolbarItem={currentFilterType.id === id}
            filterIds={selectedFilters[id] ?? []}
            allSupportedFilters={filterValues}
            setFilters={(filtersToSave) => onFilterUpdate({ ...selectedFilters, [id]: filtersToSave })}
            title={placeholder}
          />
        )
        )}
      </ToolbarGroup>
    </ToolbarToggleGroup>
  )
}

VmFilters.propTypes = {
  operatingSystems: PropTypes.object.isRequired,
  selectedFilters: PropTypes.object.isRequired,
  onFilterUpdate: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  ({ operatingSystems, vms }) => ({
    operatingSystems,
    selectedFilters: toJS(vms.get('filters')),
  }),
  (dispatch) => ({
    onFilterUpdate: (filters) => dispatch(saveVmsFilters({ filters })),
  })
)(withMsg(VmFilters))
