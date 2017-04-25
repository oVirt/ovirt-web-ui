import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { Modal, Button } from 'react-bootstrap'

import {
  closeDialog,
  requestCloseDialogConfirmation,
} from '../../actions/index'

import style from './style.css'

const CloseDialogConfirmation = ({ onDismissChanges, onKeepDialog }) => {
  return (
    <Modal show dialogClassName={style['cust-modal-content']}>
      <Modal.Header bsClass={`modal-header ${style['cust-modal-header']}`}>
        <Modal.Title>Dialog contains unsaved changes</Modal.Title>
      </Modal.Header>
      <Modal.Body bsClass={`modal-body ${style['cust-modal-body']}`}>
        <h4>Are you sure you want to drop your changes?</h4>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onKeepDialog} bsClass='btn btn-default'>No</Button>
        <Button onClick={onDismissChanges} bsClass='btn btn-info'>Yes</Button>
      </Modal.Footer>
    </Modal>
  )
}
CloseDialogConfirmation.propTypes = {
  onDismissChanges: PropTypes.func.isRequired,
  onKeepDialog: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({}),
  (dispatch) => ({
    onDismissChanges: () => dispatch(closeDialog({ force: true })),
    onKeepDialog: () => dispatch(requestCloseDialogConfirmation()),
  })
)(CloseDialogConfirmation)
