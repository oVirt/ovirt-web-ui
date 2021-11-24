import React, { useContext } from 'react'
import PropsTypes from 'prop-types'
import { Modal, ModalVariant, Button } from '@patternfly/react-core'
import { MsgContext } from '_/intl'

const btnPropType = PropsTypes.shape({
  title: PropsTypes.string,
  onClick: PropsTypes.func,
})

const ConfirmationModal = ({ show, title, confirm, body, subContent, onClose, extra, variant = 'warning', closeTitle }) => {
  const { msg } = useContext(MsgContext)
  return (
    <Modal
      title={title}
      isOpen={show}
      variant={ModalVariant.small}
      titleIconVariant={variant}
      position='top'
      onClose={onClose}
      actions={[
        <Button key='confirm' variant={confirm.type || 'primary'} onClick={() => { confirm.onClick(); onClose() }}>{confirm.title}</Button>,
        extra && <Button key='extra' variant='secondary' onClick={() => { extra.onClick(); onClose() }}>{extra.title}</Button>,
        <Button key='cancel' variant='link' onClick={onClose}>{closeTitle ?? msg.cancel()}</Button>,
      ].filter(Boolean)}
    >
      {
          typeof body === 'string'
            ? (
              <>
                <p className='lead'>
                  { body }
                </p>
                {
                  subContent && typeof subContent === 'string'
                    ? <p>{ subContent }</p>
                    : subContent
                }
              </>
            )
            : body
        }
    </Modal>
  )
}

ConfirmationModal.propTypes = {
  show: PropsTypes.bool,
  title: PropsTypes.string.isRequired,

  onClose: PropsTypes.func,
  confirm: PropsTypes.shape({
    title: PropsTypes.string,
    type: PropsTypes.oneOf(['primary', 'secondary', 'tertiary', 'danger', 'warning', 'link', 'plain', 'control']),
    onClick: PropsTypes.func,
  }),
  extra: btnPropType,
  closeTitle: PropsTypes.string,
  body: PropsTypes.oneOfType([PropsTypes.node, PropsTypes.string]).isRequired,
  subContent: PropsTypes.oneOfType([PropsTypes.node, PropsTypes.string]),
  variant: PropsTypes.oneOf(['success', 'danger', 'warning', 'info', 'default']),
}

export default ConfirmationModal
