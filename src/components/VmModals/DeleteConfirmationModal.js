import React from 'react'
import PropsTypes from 'prop-types'
import { Modal } from 'patternfly-react'
import { msg } from '../../intl'

const DeleteConfirmationModal = ({ show, onDelete, children, onClose }) => {
  return (
    <Modal onHide={onClose} show={show}>
      <Modal.Header>
        <button
          className='close'
          onClick={onClose}
        >
          <span className='pficon pficon-close' title='Close' />
        </button>
        <Modal.Title>{msg.confirmDelete()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        { children }
      </Modal.Body>
      <Modal.Footer>
        <button className='btn btn-default' onClick={onClose}>{msg.cancel()}</button>
        <button className='btn btn-danger' onClick={onDelete}>{msg.delete()}</button>
      </Modal.Footer>
    </Modal>
  )
}

DeleteConfirmationModal.propTypes = {
  show: PropsTypes.bool.isRequired,
  children: PropsTypes.node.isRequired,
  onDelete: PropsTypes.func.isRequired,
  onClose: PropsTypes.func.isRequired,
}

export default DeleteConfirmationModal
