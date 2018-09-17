import React from 'react'
import PropsTypes from 'prop-types'
import {
  MessageDialog,
  Button,
  Icon,
  noop,
} from 'patternfly-react'
import { msg } from '../../../../intl'

const HotPlugChangeConfirmationModal = ({ show, onCancel, onApplyLater, onApplyNow }) => {
  return <MessageDialog
    show={show}
    onHide={onCancel}
    title='Apply Changes'
    icon={<Icon type='pf' name='warning-triangle-o' />}

    primaryContent={<div className='lead'>
      Apply Changes Now with Hot Plug
    </div>}
    secondaryContent={<div>
      Applying the changes to CPU and/or Memory can be done right now but it requires
      doing a hot plug.  You can choose to apply these changes after a restart instead.
    </div>}

    accessibleName='prompt-hot-plug'
    accessibleDescription='hot-plug-configuration-change-will-be-applied-now'

    primaryAction={noop}
    primaryActionButtonContent=''
    footer={<React.Fragment>
      <Button onClick={onCancel}>{msg.cancel()}</Button>
      <Button onClick={onApplyLater}>Apply after Restart</Button>
      <Button bsStyle='primary' onClick={onApplyNow}>Apply Changes Now</Button>
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
