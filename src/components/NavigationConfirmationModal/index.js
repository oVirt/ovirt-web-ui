import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Modal, ModalVariant, Button } from '@patternfly/react-core'
import { MsgContext } from '_/intl'

const NavigationConfirmationModal = ({ show, onYes, onNo, additionalNote }) => {
  const { msg } = useContext(MsgContext)
  const idPrefix = 'close-dialog-confim'

  return (
    <Modal
      isOpen={show}
      title={msg.unsavedChangesConfirmMessage()}
      titleIconVariant='warning'
      variant={ModalVariant.small}
      onClose={onNo}
      position='top'
      actions={[
        <Button id={`${idPrefix}-button-yes`} key="confirm" variant="primary" onClick={onYes}>
          {msg.yes()}
        </Button>,
        <Button id={`${idPrefix}-button-no`} key="cancel" variant="link" onClick={onNo}>
          {msg.no()}
        </Button>,
      ]}
    >
      <p>{msg.allUnsavedWillBeLost()}</p>
      <p>{additionalNote}</p>
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
