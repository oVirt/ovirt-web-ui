import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Modal } from 'patternfly-react'

import { downloadConsole } from '../../actions/index'

import { msg } from '../../intl'

import { checkConsoleInUse, setConsoleInUse } from './actions'

class ConsoleConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      openModal: false,
    }
    this.onConsoleConfirmationClose = this.onConsoleConfirmationClose.bind(this)
    this.onConsoleDownload = this.onConsoleDownload.bind(this)
  }

  componentWillReceiveProps (newProps) {
    if (newProps.show) {
      this.props.onCheckConsoleSessionInUse()
    }
  }

  onConsoleConfirmationClose () {
    this.setState({
      openModal: false,
    })
    this.props.onConsoleSessionConfirmaClose()
  }

  onConsoleDownload () {
    this.setState({
      openModal: false,
    })

    this.props.onDownloadConsole()
  }

  render () {
    let {
      vm,
      VmAction,
      onClose,
      show,
    } = this.props

    if (!VmAction.getIn(['vms', vm.get('id'), 'consoleInUse'])) {
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
          <button className='btn btn-default' onClick={onClose}>{msg.cancel()}</button>
          <button className='btn btn-info' onClick={() => { this.onConsoleDownload(); onClose() }}>{msg.yes()}</button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ConsoleConfirmationModal.propTypes = {
  vm: PropTypes.object.isRequired,
  VmAction: PropTypes.object.isRequired,
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
    VmAction: state.VmAction,
  }),
  (dispatch, { vm, consoleId, usbFilter, userId }) => ({
    onCheckConsoleSessionInUse: () => dispatch(checkConsoleInUse({ vmId: vm.get('id'), usbFilter, userId })),
    onConsoleSessionConfirmaClose: () => dispatch(setConsoleInUse({ vmId: vm.get('id'), consoleInUse: false })),
    onDownloadConsole: () => dispatch(downloadConsole({ vmId: vm.get('id'), usbFilter, consoleId })),
  })
)(ConsoleConfirmationModal)
