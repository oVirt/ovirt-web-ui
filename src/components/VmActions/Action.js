import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  ButtonVariant,
} from '@patternfly/react-core'

const ActionButtonWraper = ({ id, actionDisabled, shortTitle, onClick, variant = ButtonVariant.control }) => {
  return (
    <Button
      id={id}
      isDisabled={actionDisabled}
      variant={variant}
      onClick={onClick}
    >
      {shortTitle}
    </Button>
  )
}
ActionButtonWraper.propTypes = {
  shortTitle: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  actionDisabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  variant: PropTypes.string,
}

export { ActionButtonWraper }
