import React from 'react'
import PropsTypes from 'prop-types'
import {
  MessageDialog,
  Button,
  Icon,
  noop,
} from 'patternfly-react'
import { msg } from '../../../../intl'

const NextRunChangeConfirmationModal = ({ show, onCancel, onSave, onSaveAndRestart }) => {
  return <MessageDialog
    show={show}
    onHide={onCancel}
    title='Configuration Change on Restart'
    icon={<Icon type='pf' name='warning-triangle-o' />}

    primaryContent={<div className='lead'>
      Some Configuration Changes Will Be Applied on Restart
    </div>}
    secondaryContent={<div>
      Some configuration changes will not be able to take effect until the
      Virtual Machine is restarted next.  A power cycle needs to take place to
      pick up this new configuration.
    </div>}

    accessibleName='prompt-next-run'
    accessibleDescription='next-run-configuration-change-will-be-applied-on-restart'

    primaryAction={noop}
    primaryActionButtonContent=''
    footer={<React.Fragment>
      <Button onClick={onCancel}>{msg.cancel()}</Button>
      <Button onClick={onSave}>Save Changes</Button>
      <Button bsStyle='primary' onClick={onSaveAndRestart}>Save Changes and Restart</Button>
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
