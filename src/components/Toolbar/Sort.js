import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { withMsg } from '_/intl'
import { translate } from '_/helpers'
import {
  Button,
  OptionsMenu,
  OptionsMenuItemGroup,
  OptionsMenuSeparator,
  OptionsMenuItem,
  OptionsMenuToggle,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { SortAmountDownIcon, SortAmountDownAltIcon } from '@patternfly/react-icons/dist/esm/icons'

const Sort = ({ sort, msg, onSortChange, SortFields }) => {
  const { id: enabledSortId, isAsc } = sort || {}
  const [expanded, setExpanded] = useState(false)

  const menuItems = [
    <OptionsMenuItemGroup key="first group" aria-label={msg.sortColumn()}>
      {Object.values(SortFields)
        .map(type => ({ ...type, title: translate({ ...type.messageDescriptor, msg }) }))
        .map(({ title, id, messageDescriptor }) => (
          <OptionsMenuItem
            id={id}
            key={id}
            isSelected={id === enabledSortId}
            onSelect={() => onSortChange({ ...sort, id, messageDescriptor })}
          >
            {title}
          </OptionsMenuItem>
        ))
    }
    </OptionsMenuItemGroup>,
    <OptionsMenuSeparator key="separator"/>,
    <OptionsMenuItemGroup key="second group" aria-label={msg.sortDirection()}>
      <OptionsMenuItem onSelect={() => onSortChange({ ...sort, isAsc: true })} isSelected={isAsc} id="ascending" key="ascending">{msg.ascending()}</OptionsMenuItem>
      <OptionsMenuItem onSelect={() => onSortChange({ ...sort, isAsc: false })} isSelected={!isAsc} id="descending" key="descending">{msg.descending()}</OptionsMenuItem>
    </OptionsMenuItemGroup>,
  ]

  return (
    <ToolbarGroup variant='filter-group'>
      <ToolbarItem >
        <OptionsMenu
          menuItems={menuItems}
          isOpen={expanded}
          toggle={(
            <OptionsMenuToggle
              onToggle={() => setExpanded(!expanded)}
              toggleTemplate={sort?.messageDescriptor ? translate({ ...sort.messageDescriptor, msg }) : msg.sortBy()}
            />
          )}
          isGrouped
        />
      </ToolbarItem>
      <ToolbarItem>
        <Button variant='plain' aria-label={msg.sortDirection()} onClick={() => onSortChange({ ...sort, isAsc: !isAsc })}>
          {isAsc ? <SortAmountDownAltIcon/> : <SortAmountDownIcon/>}
        </Button>
      </ToolbarItem>
    </ToolbarGroup>
  )
}

Sort.propTypes = {
  sort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    messageDescriptor: PropTypes.object.isRequired,
    isAsc: PropTypes.bool,
  }),
  SortFields: PropTypes.objectOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    messageDescriptor: PropTypes.object.isRequired,
  })).isRequired,
  onSortChange: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default withMsg(Sort)
