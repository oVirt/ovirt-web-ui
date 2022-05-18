import React, { useContext } from 'react'
import PropsTypes from 'prop-types'
import { MsgContext } from '_/intl'
import ConfirmationModal from '_/components/VmActions/ConfirmationModal'

const NextRunChangeConfirmationModal = ({ show, onCancel, onSave, onSaveAndRestart }) => {
  const { msg } = useContext(MsgContext)
  return (
    <ConfirmationModal
      show={show}
      onClose={onCancel}
      title={msg.nextRunConfirmTitle()}

      body={msg.nextRunConfirmContentDetail()}

      extra={{ onClick: onSave, title: msg.nextRunConfirmActionSave() }}
      confirm={{ onClick: onSaveAndRestart, title: msg.nextRunConfrimActionSaveRestart() }}
    />
  )
}

NextRunChangeConfirmationModal.propTypes = {
  show: PropsTypes.bool.isRequired,

  onCancel: PropsTypes.func.isRequired,
  onSave: PropsTypes.func.isRequired,
  onSaveAndRestart: PropsTypes.func.isRequired,
}

export default NextRunChangeConfirmationModal
