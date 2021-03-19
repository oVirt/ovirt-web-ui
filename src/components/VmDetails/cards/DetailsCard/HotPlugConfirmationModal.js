import React, { useContext } from 'react'
import PropsTypes from 'prop-types'
import {
  MessageDialog,
  Button,
  Icon,
  noop,
} from 'patternfly-react'
import { MsgContext } from '_/intl'

const HotPlugChangeConfirmationModal = ({ show, onCancel, onApplyLater, onApplyNow }) => {
  const { msg } = useContext(MsgContext)
  return <MessageDialog
    show={show}
    onHide={onCancel}
    title={msg.hotPlugConfirmTitle()}
    icon={<Icon type='pf' name='warning-triangle-o' />}

    primaryContent={<div className='lead'>{msg.hotPlugConfirmContent()}</div>}
    secondaryContent={<div>{msg.hotPlugConfirmContentDetail()}</div>}

    accessibleName='prompt-hot-plug'
    accessibleDescription='hot-plug-configuration-change-will-be-applied-now'

    primaryAction={noop}
    primaryActionButtonContent=''
    footer={<React.Fragment>
      <Button onClick={onCancel}>{msg.cancel()}</Button>
      <Button onClick={onApplyLater}>{msg.hotPlugConfirmApplyAfterRestart()}</Button>
      <Button bsStyle='primary' onClick={onApplyNow}>{msg.hotPlugConfirmApplyNow()}</Button>
    </React.Fragment>}
  />
}

HotPlugChangeConfirmationModal.propTypes = {
  show: PropsTypes.bool.isRequired,

  onCancel: PropsTypes.func.isRequired,
  onApplyLater: PropsTypes.func.isRequired,
  onApplyNow: PropsTypes.func.isRequired,
}

export default HotPlugChangeConfirmationModal
