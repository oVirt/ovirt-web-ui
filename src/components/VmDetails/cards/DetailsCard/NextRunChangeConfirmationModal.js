import React, { useContext } from 'react'
import PropsTypes from 'prop-types'
import {
  MessageDialog,
  Button,
  Icon,
  noop,
} from 'patternfly-react'
import { MsgContext } from '_/intl'

const NextRunChangeConfirmationModal = ({ show, onCancel, onSave, onSaveAndRestart }) => {
  const { msg } = useContext(MsgContext)
  return <MessageDialog
    show={show}
    onHide={onCancel}
    title={msg.nextRunConfirmTitle()}
    icon={<Icon type='pf' name='warning-triangle-o' />}

    primaryContent={<div className='lead'>{msg.nextRunConfirmContent()}</div>}
    secondaryContent={<div>{msg.nextRunConfirmContentDetail()}</div>}

    accessibleName='prompt-next-run'
    accessibleDescription='next-run-configuration-change-will-be-applied-on-restart'

    primaryAction={noop}
    primaryActionButtonContent=''
    footer={<React.Fragment>
      <Button onClick={onCancel}>{msg.cancel()}</Button>
      <Button onClick={onSave}>{msg.nextRunConfirmActionSave()}</Button>
      <Button bsStyle='primary' onClick={onSaveAndRestart}>
        {msg.nextRunConfrimActionSaveRestart()}
      </Button>
    </React.Fragment>}
  />
}

NextRunChangeConfirmationModal.propTypes = {
  show: PropsTypes.bool.isRequired,

  onCancel: PropsTypes.func.isRequired,
  onSave: PropsTypes.func.isRequired,
  onSaveAndRestart: PropsTypes.func.isRequired,
}

export default NextRunChangeConfirmationModal
