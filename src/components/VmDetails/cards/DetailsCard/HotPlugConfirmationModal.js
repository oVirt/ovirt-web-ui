import React, { useContext } from 'react'
import PropsTypes from 'prop-types'
import { MsgContext } from '_/intl'
import ConfirmationModal from '_/components/VmActions/ConfirmationModal'

const HotPlugChangeConfirmationModal = ({ show, onCancel, onApplyLater, onApplyNow }) => {
  const { msg } = useContext(MsgContext)
  return (
    <ConfirmationModal
      show={show}
      onClose={onCancel}
      title={msg.hotPlugConfirmTitle()}

      body={msg.hotPlugConfirmContent()}
      subContent={msg.hotPlugConfirmContentDetail()}

      confirm={{ title: msg.hotPlugConfirmApplyNow(), onClick: onApplyNow }}
      extra={{ title: msg.hotPlugConfirmApplyAfterRestart(), onClick: onApplyLater }}
    />
  )
}

HotPlugChangeConfirmationModal.propTypes = {
  show: PropsTypes.bool.isRequired,

  onCancel: PropsTypes.func.isRequired,
  onApplyLater: PropsTypes.func.isRequired,
  onApplyNow: PropsTypes.func.isRequired,
}

export default HotPlugChangeConfirmationModal
