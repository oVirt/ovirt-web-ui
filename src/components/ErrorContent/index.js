import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  Title,
} from '@patternfly/react-core'
import * as branding from '_/branding'

const ErrorContent = ({ title, description, leftButton, rightButton }) => (
  <EmptyState>
    <EmptyStateIcon icon={() => <img src={branding.resourcesUrls.errorImg} />} />
    <Title headingLevel="h4" size="lg">
      {title}
    </Title>
    <EmptyStateBody>
      {description}
    </EmptyStateBody>
    <EmptyStateSecondaryActions>
      <Button
        component='a'
        href={leftButton.href}
        onClick={leftButton.onClick}
        variant='secondary'
      >
        {leftButton.title}
      </Button>
      <Button
        component='a'
        href={rightButton.href}
        onClick={rightButton.onClick}
        variant='primary'
      >
        {rightButton.title}
      </Button>
    </EmptyStateSecondaryActions>
  </EmptyState>
)

const buttonType = PropTypes.shape({
  onClick: PropTypes.func,
  href: PropTypes.string,
  title: PropTypes.string.isRequired,
}).isRequired

ErrorContent.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
  leftButton: buttonType,
  rightButton: buttonType,
}

export default ErrorContent
