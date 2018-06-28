import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Modal } from 'patternfly-react'

import { downloadConsole, checkConsoleInUse, setConsoleInUse } from '../../actions/index'

import { msg } from '../../intl'

class ConsoleConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.checkConsoleInUseSended = false
    this.onConsoleConfirmationClose = this.onConsoleConfirmationClose.bind(this)
    this.onConsoleDownload = this.onConsoleDownload.bind(this)
  }

  componentWillReceiveProps (newProps) {
    if (newProps.show && !this.checkConsoleInUseSended) {
      this.checkConsoleInUseSended = true
      this.props.onCheckConsoleSessionInUse({ usbFilter: newProps.config.get('usbFilter'), userId: newProps.config.getIn(['user', 'id']) })
    }
  }

  onConsoleConfirmationClose () {
    this.checkConsoleInUseSended = false
    this.props.onConsoleSessionConfirmaClose()
    this.props.onClose()
  }

  onConsoleDownload () {
    this.props.onDownloadConsole({ usbFilter: this.props.config.get('usbFilter') })
  }

  render () {
    let {
      vm,
      onClose,
      show,
    } = this.props

    if (!vm.get('consoleInUse')) {
      return null
    }

    return (
      <Modal onHide={onClose} show={show}>
        <Modal.Header>
          <button
            className='close'
            onClick={onClose}
          >
            <span className='pficon pficon-close' title='Close' />
          </button>
          <Modal.Title>{ msg.console() }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{ msg.consoleInUseContinue() }</p>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-default' onClick={this.onConsoleConfirmationClose}>{msg.cancel()}</button>
          <button className='btn btn-info' onClick={() => { this.onConsoleDownload(); onClose() }}>{msg.yes()}</button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ConsoleConfirmationModal.propTypes = {
  vm: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  usbFilter: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  show: PropTypes.bool,
  consoleId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  userId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  onDownloadConsole: PropTypes.func.isRequired,
  onConsoleSessionConfirmaClose: PropTypes.func.isRequired,
  onCheckConsoleSessionInUse: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch, { vm, consoleId }) => ({
    onCheckConsoleSessionInUse: ({ usbFilter, userId }) => dispatch(checkConsoleInUse({ vmId: vm.get('id'), usbFilter, userId })),
    onConsoleSessionConfirmaClose: () => dispatch(setConsoleInUse({ vmId: vm.get('id'), consoleInUse: false })),
    onDownloadConsole: ({ usbFilter }) => dispatch(downloadConsole({ vmId: vm.get('id'), usbFilter, consoleId })),
  })
)(ConsoleConfirmationModal)
