import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Modal, Button } from 'patternfly-react'
import { Alert } from '@patternfly/react-core'
import { MsgContext } from '_/intl'

const NavigationConfirmationModal = ({ show, onYes, onNo, additionalNote }) => {
  const { msg } = useContext(MsgContext)
  const idPrefix = 'close-dialog-confim'

  return (
    <Modal show={show}>
      <Modal.Header>
        <Modal.Title id={`${idPrefix}-title`}>{msg.unsavedChangesTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert
          variant='warning'
          isInline
          isPlain
          id={`${idPrefix}-body-text`}
          title={msg.unsavedChangesConfirmMessage()}
        >
          {additionalNote}
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button id={`${idPrefix}-button-no`} onClick={onNo} bsStyle='default'>{msg.no()}</Button>
        <Button id={`${idPrefix}-button-yes`} onClick={onYes} bsStyle='primary'>{msg.yes()}</Button>
      </Modal.Footer>
    </Modal>
  )
}
NavigationConfirmationModal.propTypes = {
  show: PropTypes.bool,
  onYes: PropTypes.func.isRequired,
  onNo: PropTypes.func.isRequired,
  additionalNote: PropTypes.string,
}
NavigationConfirmationModal.defaultProps = {
  show: false,
}

export default NavigationConfirmationModal
