import React, { useState } from 'react'
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'
import PropTypes from 'prop-types'

const VmSelect = ({ vms, onChange, selected, msg }) => {
  const [open, setOpen] = useState(false)

  const options = vms.valueSeq().toJS()
    .map(({ id, name }) => ({ id, name, toString: () => name }))
  const selectedOption = !selected
    ? undefined
    : options.find(({ id }) => id === selected) || { id: selected, toString: () => selected }

  const clearSelection = () => {
    setOpen(false)
    onChange('')
  }

  const onSelect = (event, { id = '' } = {}, isPlaceholder) => {
    if (isPlaceholder) {
      clearSelection()
    } else {
      setOpen(false)
      onChange(id)
    }
  }

  const titleId = 'vmselect-select-id-1'
  return (
    <div>
      <span id={titleId} hidden>
        {msg.selectVm()}
      </span>
      <Select
        variant={SelectVariant.typeahead}
        typeAheadAriaLabel={msg.selectVm()}
        onToggle={setOpen}
        onSelect={onSelect}
        onClear={clearSelection}
        selections={selectedOption}
        isOpen={open}
        aria-labelledby={titleId}
        placeholderText={msg.selectVm()}
        noResultsFoundText={msg.noVmAvailable()}
      >
        {options.map((option) => (
          <SelectOption
            key={option.id}
            value={option}
          />
        ))}
      </Select>

    </div>
  )
}

VmSelect.propTypes = {
  vms: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  ({ vms }) => ({
    vms: vms.get('vms'),
  })
)(withMsg(VmSelect))
