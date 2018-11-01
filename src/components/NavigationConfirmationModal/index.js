import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Button, Alert } from 'patternfly-react'
import { msg } from 'app-intl'

const NavigationConfirmationModal = ({ show, onYes, onNo }) => {
  const idPrefix = 'close-dialog-confim'

  return (
    <Modal show={show}>
      <Modal.Header>
        <Modal.Title id={`${idPrefix}-title`}>{msg.unsavedChangesTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert type='warning' id={`${idPrefix}-body-text`}>{msg.unsavedChangesConfirmMessage()}</Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button id={`${idPrefix}-button-no`} onClick={onNo} bsStyle='default'>No</Button>
        <Button id={`${idPrefix}-button-yes`} onClick={onYes} bsStyle='primary'>Yes</Button>
      </Modal.Footer>
    </Modal>
  )
}
NavigationConfirmationModal.propTypes = {
  show: PropTypes.bool,
  onYes: PropTypes.func.isRequired,
  onNo: PropTypes.func.isRequired,
}
NavigationConfirmationModal.defaultProps = {
  show: false,
}

export default NavigationConfirmationModal
