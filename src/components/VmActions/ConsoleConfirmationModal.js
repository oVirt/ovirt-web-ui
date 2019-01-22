import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import ConfirmationModal from './ConfirmationModal'

import { downloadConsole, checkConsoleInUse, setConsoleInUse, setConsoleLogon } from '_/actions'
import { msg } from '_/intl'

class ConsoleConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.checkConsoleInUseSended = false
    this.onConsoleConfirmationClose = this.onConsoleConfirmationClose.bind(this)
    this.onConsoleDownload = this.onConsoleDownload.bind(this)
  }

  componentWillUpdate (newProps) {
    if (newProps.show && !this.checkConsoleInUseSended) {
      this.checkConsoleInUseSended = true
      this.props.onCheckConsoleSessionInUse({ usbFilter: this.props.config.get('usbFilter'), userId: this.props.config.getIn(['user', 'id']) })
    }
    if (newProps.show && newProps.consoles.getIn(['vms', newProps.vm.get('id'), 'consoleInUse']) === false) {
      this.onConsoleConfirmationClose()
    }
  }

  onConsoleConfirmationClose () {
    this.checkConsoleInUseSended = false
    this.props.onConsoleSessionConfirmaClose()
    this.props.onClose()
  }

  onConsoleDownload (force = false) {
    this.props.onDownloadConsole({ usbFilter: this.props.config.get('usbFilter'), force, userId: this.props.config.getIn(['user', 'id']) })
  }

  render () {
    const {
      vm,
      consoles,
      show,
    } = this.props

    if (consoles.getIn(['vms', vm.get('id'), 'isLogon']) === false) {
      return (
        <ConfirmationModal
          show
          onClose={this.onConsoleConfirmationClose}
          title={msg.console()}
          body={msg.cantLogonToConsole()}
          confirm={{ title: msg.connect(), onClick: () => this.onConsoleDownload(true) }}
        />
      )
    }

    if (!show || !consoles.getIn(['vms', vm.get('id'), 'consoleInUse'])) {
      return null
    }

    return (
      <ConfirmationModal
        onClose={this.onConsoleConfirmationClose}
        show={show}
        title={msg.console()}
        body={msg.consoleInUseContinue()}
        confirm={{ title: msg.yes(), onClick: () => this.onConsoleDownload() }}
      />
    )
  }
}

ConsoleConfirmationModal.propTypes = {
  vm: PropTypes.object.isRequired,
  consoles: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  show: PropTypes.bool,
  consoleId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  onDownloadConsole: PropTypes.func.isRequired,
  onConsoleSessionConfirmaClose: PropTypes.func.isRequired,
  onCheckConsoleSessionInUse: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
    consoles: state.consoles,
  }),
  (dispatch, { vm, consoleId }) => ({
    onCheckConsoleSessionInUse: ({ usbFilter, userId }) => dispatch(checkConsoleInUse({ vmId: vm.get('id'), usbFilter, userId, hasGuestAgent: vm.get('ssoGuestAgent') })),
    onConsoleSessionConfirmaClose: () => {
      dispatch(setConsoleInUse({ vmId: vm.get('id'), consoleInUse: null }))
      dispatch(setConsoleLogon({ vmId: vm.get('id'), isLogon: null }))
    },
    onDownloadConsole: ({ usbFilter, force, userId }) => dispatch(
      downloadConsole({
        vmId: vm.get('id'),
        usbFilter,
        consoleId,
        hasGuestAgent: vm.get('ssoGuestAgent'),
        force: force || vm.get('sessions').find(s => s.getIn(['user', 'id']) === userId) !== undefined,
      })
    ),
  })
)(ConsoleConfirmationModal)
