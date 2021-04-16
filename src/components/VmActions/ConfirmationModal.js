import React, { useContext } from 'react'
import PropsTypes from 'prop-types'
import { Modal, Icon } from 'patternfly-react'
import { MsgContext } from '_/intl'

const btnPropType = PropsTypes.shape({
  title: PropsTypes.string,
  onClick: PropsTypes.func,
})

const ConfirmationModal = ({ show, title, confirm, body, subContent, onClose, extra, accessibleDescription }) => {
  const { msg } = useContext(MsgContext)
  return (
    <Modal onHide={onClose} show={show} className='message-dialog-pf' aria-describedby={accessibleDescription}>
      <Modal.Header>
        <button
          className='close'
          onClick={onClose}
        >
          <span className='pficon pficon-close' title='Close' />
        </button>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
          typeof body === 'string'
            ? <React.Fragment>
              <Icon type='pf' name='warning-triangle-o' />
              <div id={accessibleDescription}>
                <p className='lead'>
                  { body }
                </p>
                {
                  subContent && typeof subContent === 'string'
                    ? <p>{ subContent }</p>
                    : subContent
                }
              </div>
            </React.Fragment>
            : body
        }
      </Modal.Body>
      <Modal.Footer>
        { extra && <button className='btn btn-info' onClick={() => { extra.onClick(); onClose() }}>{extra.title}</button> }
        <button className={`btn ${confirm ? 'btn-default' : 'btn-info'}`} onClick={onClose}>{msg.cancel()}</button>
        { confirm && <button className={`btn ${confirm.type ? `btn-${confirm.type}` : 'btn-info'}`} onClick={() => { confirm.onClick(); onClose() }}>{confirm.title}</button> }
      </Modal.Footer>
    </Modal>
  )
}

ConfirmationModal.propTypes = {
  show: PropsTypes.bool,
  title: PropsTypes.string.isRequired,

  onClose: PropsTypes.func,
  accessibleDescription: PropsTypes.string,
  confirm: PropsTypes.shape({
    title: PropsTypes.string,
    type: PropsTypes.oneOf([ 'primary', 'success', 'info', 'warning', 'danger' ]),
    onClick: PropsTypes.func,
  }),
  extra: btnPropType,
  body: PropsTypes.oneOfType([PropsTypes.node, PropsTypes.string]).isRequired,
  subContent: PropsTypes.oneOfType([PropsTypes.node, PropsTypes.string]),
}

export default ConfirmationModal
