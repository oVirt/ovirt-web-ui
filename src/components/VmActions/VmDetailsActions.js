import React, { useState } from 'react'
import PropTypes from 'prop-types'

import ConfirmationModal from './ConfirmationModal'
import { ActionButtonWraper } from './Action'
import {
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuGroup,
  OverflowMenuItem,
  OverflowMenuControl,
  OverflowMenuDropdownItem,
  KebabToggle,
  Dropdown,
  DropdownSeparator,
  DropdownToggle,
  DropdownItem,
} from '@patternfly/react-core'

const VmDetailsActions = ({ actions, id, idPrefix }) => {
  const [actionWithConfirmationId, setActionWithConfirmationId] = useState(undefined)
  const [kebabDropdownOpened, setKebabDropdownOpened] = useState(false)
  const [regularDropdownOpened, setRegularDropdownOpened] = useState(undefined)

  // confirmation for Remove action is mutable (checkbox state)
  // each render() should use the most current version
  const { confirmation } = actions.flatMap(action => action?.items ?? action)
    .find(({ id }) => id === actionWithConfirmationId) || {}

  const actionsWithSeparatorSlots = actions
    // propagate disable flag to nested actions
    .map(({ items, actionDisabled, ...rest }) => ({
      ...rest,
      actionDisabled,
      items: items?.map(({ actionDisabled: disabled, ...rest }) => ({
        ...rest,
        actionDisabled: disabled || actionDisabled,
      })),
    }))
    // remove empty composite actions
    // ["a","b",[], ["c","d"]] =>
    // ["a","b",["c","d"]]
    .filter(({ items }) => !items || items.length)
  // put empty slots for DropdownSeparator.
  // ["a","b", ["c","d"], "e"] =>
  // ["a","b", undefined,["c","d"], undefined , "e"]
    .reduce((acc, current) => {
      if (!acc.length) {
        return [current]
      }
      const [last, ...rest] = acc
      return last?.items || (last && current?.items)
        ? [current, undefined, last, ...rest]
        : [current, last, ...rest]
    }, [])
    .reverse()
  // flatten the list of actions
  // ["a","b", undefined,"c","d", undefined , "e"]
    .flatMap(a => a?.items ?? a)

  const toButton = ({ id, shortTitle, variant, onClick, actionDisabled }) => (
    <ActionButtonWraper
      id={id}
      shortTitle={shortTitle}
      variant={variant}
      actionDisabled={actionDisabled}
      onClick={onClick ?? (() => setActionWithConfirmationId(id)) }
    />
  )
  const toDropDown = ({ id, shortTitle, variant, onClick, items, actionDisabled }) => (
    <Dropdown
      position="right"
      onSelect={ () => setKebabDropdownOpened(!kebabDropdownOpened)}
      toggle={(
        <DropdownToggle
          id={id}
          isDisabled={actionDisabled}
          onToggle={() => setRegularDropdownOpened(regularDropdownOpened === id ? undefined : id)}
        >
          {shortTitle}
        </DropdownToggle>
      )}
      isOpen={regularDropdownOpened === id}
      dropdownItems={
             items.map(action => (
               <DropdownItem
                 key={action.id}
                 component='button'
                 onClick={action.onClick ?? (() => setActionWithConfirmationId(action.id)) }
                 id={action.id}
                 icon={action.icon}
                 isDisabled={action.actionDisabled}
               >
                 {action.shortTitle}
               </DropdownItem>
             ))
            }
    />
  )

  return [(
    <OverflowMenu breakpoint="lg" key={`${idPrefix}-overflow-group`}>
      <OverflowMenuContent>
        <OverflowMenuGroup groupType="button">
          {actions.map(action => (
            <OverflowMenuItem key={action.id}>
              {action.items ? toDropDown(action) : toButton(action)}
            </OverflowMenuItem>
          ))}
        </OverflowMenuGroup>
      </OverflowMenuContent>
      <OverflowMenuControl >
        <Dropdown
          position="right"
          onSelect={ () => setKebabDropdownOpened(!kebabDropdownOpened)}
          toggle={<KebabToggle onToggle={setKebabDropdownOpened} />}
          isOpen={kebabDropdownOpened}
          isPlain
          dropdownItems={
             actionsWithSeparatorSlots
               .map((action, index) => action
                 ? (
                   <OverflowMenuDropdownItem
                     isShared
                     key={action.id}
                     component='button'
                     onClick={action.onClick ?? (() => setActionWithConfirmationId(action.id)) }
                     id={action.id}
                     icon={action.icon}
                     isDisabled={action.actionDisabled}
                   >
                     {action.shortTitle}
                   </OverflowMenuDropdownItem>
                 )
                 : <DropdownSeparator key={`${index}`} />)
            }
        />
      </OverflowMenuControl>
    </OverflowMenu>),
  confirmation && (
    <ConfirmationModal
      key={`${idPrefix}-confirmation`}
      show={!!confirmation}
      onClose={() => setActionWithConfirmationId(undefined)}
      title={confirmation?.title}
      body={confirmation?.body}
      confirm={confirmation?.confirm}
      extra={confirmation?.extra}
      subContent={confirmation?.subContent}
    />
  ),
  ]
}

VmDetailsActions.propTypes = {
  actions: PropTypes.array.isRequired,
  id: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
}

export default VmDetailsActions
