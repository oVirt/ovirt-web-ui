import React from 'react'
import PropsTypes from 'prop-types'
import { Modal } from 'patternfly-react'
import { msg } from '../../intl'

const RestoreConfirmationModal = ({ show, onRestore, description, onClose }) => {
  return (
    <Modal onHide={onClose} show={show}>
      <Modal.Header>
        <button
          className='close'
          onClick={onClose}
        >
          <span className='pficon pficon-close' title='Close' />
        </button>
        <Modal.Title>{msg.confirmRestore()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p dangerouslySetInnerHTML={{ __html: msg.areYouSureYouWantToRestoreSnapshot({ snapshotName: `"<strong>${description}</strong>"` }) }} />
        <p>{msg.thisOperationCantBeUndone()}</p>
      </Modal.Body>
      <Modal.Footer>
        <button className='btn btn-default' onClick={onClose}>{msg.cancel()}</button>
        <button className='btn btn-primary' onClick={onRestore}>{msg.restore()}</button>
      </Modal.Footer>
    </Modal>
  )
}

RestoreConfirmationModal.propTypes = {
  show: PropsTypes.bool.isRequired,
  description: PropsTypes.string.isRequired,
  onRestore: PropsTypes.func.isRequired,
  onClose: PropsTypes.func.isRequired,
}

export default RestoreConfirmationModal
