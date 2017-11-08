import React from 'react'
import PropTypes from 'prop-types'

import { Modal, Button } from 'react-bootstrap'

import style from './style.css'

const CloseDialogConfirmation = ({ onYes, onNo }) => {
  const idPrefix = 'closedialogconfim'
  return (
    <Modal show dialogClassName={style['cust-modal-content']}>
      <Modal.Header bsClass={`modal-header ${style['cust-modal-header']}`}>
        <Modal.Title id={`${idPrefix}-title`}>Dialog contains unsaved changes</Modal.Title>
      </Modal.Header>
      <Modal.Body bsClass={`modal-body ${style['cust-modal-body']}`}>
        <h4 id={`${idPrefix}-body-text`}>Are you sure you want to drop your changes?</h4>
      </Modal.Body>
      <Modal.Footer>
        <Button id={`${idPrefix}-button-no`} onClick={onNo} bsClass='btn btn-default'>No</Button>
        <Button id={`${idPrefix}-button-yes`} onClick={onYes} bsClass='btn btn-info'>Yes</Button>
      </Modal.Footer>
    </Modal>
  )
}
CloseDialogConfirmation.propTypes = {
  onYes: PropTypes.func.isRequired,
  onNo: PropTypes.func.isRequired,
}

export default CloseDialogConfirmation
