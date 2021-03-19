import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import ConfirmationModal from './ConfirmationModal'

import { downloadConsole, openConsoleModal, closeConsoleModal } from '_/actions'
import { withMsg } from '_/intl'
import { doesVmSessionExistForUserId } from '_/utils'
import { generateUnique } from '_/helpers'

import {
  CONSOLE_IN_USE,
  CONSOLE_LOGON,
} from '_/constants'

class ConsoleConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.checkConsoleInUseSended = false
    this.onConsoleConfirmationClose = this.onConsoleConfirmationClose.bind(this)
    this.onConsoleDownload = this.onConsoleDownload.bind(this)
    this.modalId = generateUnique(`${props.vm.get('id')} ${props.consoleId}`)
    if (props.show) {
      props.onOpen({
        usbAutoshare: props.config.get('usbAutoshare'),
        usbFilter: props.config.get('usbFilter'),
        userId: props.config.getIn(['user', 'id']),
        modalId: this.modalId,
      })
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.show !== this.props.show && this.props.show) {
      this.modalId = generateUnique(`${this.props.vm.get('id')} ${this.props.consoleId}`)
      this.props.onOpen({
        usbAutoshare: this.props.config.get('usbAutoshare'),
        usbFilter: this.props.config.get('usbFilter'),
        userId: this.props.config.getIn(['user', 'id']),
        modalId: this.modalId,
      })
    } else {
      if (this.props.consoles.getIn(['modals', this.modalId, 'state']) === undefined) {
        this.props.onClose()
      }
    }
  }

  onConsoleConfirmationClose () {
    this.props.onConsoleSessionConfirmaClose({ modalId: this.modalId })
    this.props.onClose()
  }

  onConsoleDownload (skipSSO = false) {
    this.props.onDownloadConsole({
      usbAutoshare: this.props.config.get('usbAutoshare'),
      usbFilter: this.props.config.get('usbFilter'),
      skipSSO,
      userId: this.props.config.getIn(['user', 'id']),
      modalId: this.modalId,
    })
  }

  render () {
    const {
      consoles,
      show,
      msg,
    } = this.props

    if (consoles.getIn(['modals', this.modalId, 'state'])) {
      if (consoles.getIn(['modals', this.modalId, 'state']) === CONSOLE_LOGON) {
        return (
          <ConfirmationModal
            show
            onClose={this.onConsoleConfirmationClose}
            title={msg.console()}
            body={msg.cantLogonToConsole()}
            confirm={{ title: msg.yes(), onClick: () => this.onConsoleDownload(true) }}
          />
        )
      }
      if (consoles.getIn(['modals', this.modalId, 'state']) === CONSOLE_IN_USE) {
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
    return null
  }
}

ConsoleConfirmationModal.propTypes = {
  vm: PropTypes.object.isRequired,
  consoles: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  show: PropTypes.bool,
  isNoVNC: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  isConsolePage: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  consoleId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  onDownloadConsole: PropTypes.func.isRequired,
  onConsoleSessionConfirmaClose: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
    consoles: state.consoles,
  }),
  (dispatch, { vm, consoleId, isNoVNC, isConsolePage }) => ({
    onOpen: ({ usbAutoshare, usbFilter, userId, modalId }) => {
      dispatch(openConsoleModal({
        vmId: vm.get('id'),
        usbAutoshare,
        usbFilter,
        userId,
        consoleId,
        hasGuestAgent: vm.get('ssoGuestAgent'),
        openInPage: isConsolePage,
        isNoVNC,
        modalId,
      }))
    },
    onConsoleSessionConfirmaClose: ({ modalId }) => {
      dispatch(closeConsoleModal({ modalId }))
    },
    onDownloadConsole: ({ usbAutoshare, usbFilter, skipSSO, userId, modalId }) => {
      dispatch(downloadConsole({
        vmId: vm.get('id'),
        usbAutoshare,
        usbFilter,
        consoleId,
        hasGuestAgent: vm.get('ssoGuestAgent'),
        skipSSO: skipSSO || doesVmSessionExistForUserId(vm.get('sessions').toJS(), userId), // Parameter for skiping SSO authorization
        openInPage: isConsolePage,
        isNoVNC,
        modalId,
      }))
    },
  })
)(withMsg(ConsoleConfirmationModal))
