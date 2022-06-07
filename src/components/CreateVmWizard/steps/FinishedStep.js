import React from 'react'
import PropTypes from 'prop-types'
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  Spinner,
  Title,
} from '@patternfly/react-core'

import { withMsg } from '_/intl'

import { OkIcon, ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons'

const FinishedStep = ({
  id: propsId,
  progress: { inProgress, result, messages } = { inProgress: true },
  hideAndNavigate,
  hideAndResetState,
  msg,
}) => {
  const id = propsId ? `${propsId}-finished` : 'create-vm-wizard-finished'
  const success = result === 'success'
  return (

    <EmptyState variant="xl" isFullHeight>
      <EmptyStateIcon icon={inProgress ? Spinner : success ? OkIcon : ExclamationCircleIcon} style={{ color: success ? 'green' : 'red' }}/>
      <Title headingLevel="h4" size="lg">
        {inProgress ? msg.createVmWizardReviewInProgress() : success ? msg.createVmWizardReviewSuccess() : msg.createVmWizardReviewError()}
      </Title>

      <EmptyStateBody>
        { messages?.length > 0 && messages.map((message, index) => (
          <Alert key={index} variant={success ? 'success' : 'danger'} isInline isPlain title={message}/>
        )) }
      </EmptyStateBody>
      <EmptyStateSecondaryActions>
        <Button id={`${id}-closeAndNavigate`} isDisabled={!success} onClick={hideAndNavigate}>{msg.createVmWizardButtonCloseAndNavigate()}</Button>
        <Button id={`${id}-close`} onClick={hideAndResetState}>{ msg.createVmWizardButtonClose() }</Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  )
}

FinishedStep.propTypes = {
  id: PropTypes.string,

  progress: PropTypes.shape({
    inProgress: PropTypes.bool.isRequired,
    result: PropTypes.oneOf(['success', 'error']),
    messages: PropTypes.arrayOf(PropTypes.string),
  }),
  hideAndNavigate: PropTypes.func.isRequired,
  hideAndResetState: PropTypes.func.isRequired,

  msg: PropTypes.object.isRequired,
}

export default withMsg(FinishedStep)
