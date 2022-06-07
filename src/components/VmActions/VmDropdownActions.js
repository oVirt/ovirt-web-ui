import React, { useState } from 'react'
import PropTypes from 'prop-types'

import {
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownToggleAction,
} from '@patternfly/react-core'
import ConfirmationModal from './ConfirmationModal'
import { ActionButtonWraper } from './Action'

const VmDropdownActions = ({ actions, id }) => {
  const [actionOpen, setActionOpen] = useState(false)
  const [confirmation, setConfirmation] = useState(undefined)

  const allActions = actions
    .filter(topAction => !topAction?.actionDisabled)
    .sort((a, b) => b.priority - a.priority)
    .flatMap(action => action?.items ?? action)
    .filter(action => !action?.actionDisabled)

  if (allActions.length === 0) {
    return null
  }

  const [primaryAction, ...secondaryActions] = allActions

  return (
    <>

      {!secondaryActions.length && (
        <ActionButtonWraper
          shortTitle={primaryAction.shortTitle}
          actionDisabled={primaryAction.actionDisabled}
          id={primaryAction.id}
          onClick={primaryAction.onClick ?? (() => setConfirmation(primaryAction.confirmation))}
        />
      )}
      { !!secondaryActions.length && (
        <Dropdown
          onSelect={ () => setActionOpen(!actionOpen)}
          toggle={ (
            <DropdownToggle
              splitButtonItems={[
                <DropdownToggleAction
                  id={id}
                  key={primaryAction.shortTitle}
                  onClick={primaryAction.onClick ?? (() => setConfirmation(primaryAction.confirmation))}
                >
                  {primaryAction.shortTitle}
                </DropdownToggleAction>,
              ]}
              splitButtonVariant="action"
              onToggle={setActionOpen}
            />
          )}
          isOpen={actionOpen}
          dropdownItems={secondaryActions.map(({ shortTitle, id, icon, onClick, confirmation }) => (
            <DropdownItem
              key={shortTitle}
              component='button'
              onClick={onClick ?? (() => setConfirmation(confirmation))}
              id={id}
              icon={icon}
            >
              {shortTitle}
            </DropdownItem>
          ))}
        />
      )}
      {confirmation && (
        <ConfirmationModal
          show={!!confirmation}
          onClose={() => setConfirmation(undefined)}
          title={confirmation?.title}
          body={confirmation?.body}
          confirm={confirmation?.confirm}
          extra={confirmation?.extra}
          subContent={confirmation?.subContent}
        />
      )
    }
    </>
  )
}
VmDropdownActions.propTypes = {
  actions: PropTypes.array.isRequired,
  id: PropTypes.string.isRequired,
}

export default VmDropdownActions
