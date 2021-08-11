import React from 'react'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'
import ConfirmationModal from './ConfirmationModal'

import * as Actions from '_/actions/console'

import {
  CONSOLE_IN_USE,
  CONSOLE_LOGON,
} from '_/constants'

import {
  BROWSER_VNC,
  NATIVE_VNC,
  SPICE,
} from '_/constants/console'

const ConsoleNotificationsDialog = ({
  vmId,
  vmName,
  consoleType,
  status,
  msg,
  dismissConsoleError,
  openConsole,
  logoutOtherUsers,
}) => {
  const onClose = () => dismissConsoleError({ consoleType, vmId })
  const getTitle = () => {
    switch (consoleType) {
      case NATIVE_VNC:
      case BROWSER_VNC:
        return msg.vncConsole()
      case SPICE:
        return msg.spiceConsole()
      default:
        return msg.console()
    }
  }

  switch (status) {
    case CONSOLE_LOGON:
      return (
        <ConfirmationModal
          show={true}
          onClose={onClose}
          title={getTitle()}
          body={msg.cantLogonToConsole()}
          confirm={{
            title: msg.yes(),
            onClick: () => openConsole({
              skipSSO: true,
              logoutOtherUsers,
              vmId,
              consoleType,
            }),
          }}
        />
      )
    case CONSOLE_IN_USE:
      return (
        <ConfirmationModal
          onClose={onClose}
          show={true}
          title={getTitle()}
          body={msg.consoleInUseContinue()}
          confirm={{
            title: msg.yes(),
            onClick: () => openConsole({
              logoutOtherUsers: true,
              vmId,
              consoleType,
            }),
          }}
        />
      )
    default:
      return null
  }
}

ConsoleNotificationsDialog.propTypes = {
  vmId: PropTypes.string,
  vmName: PropTypes.string,
  consoleType: PropTypes.string,
  status: PropTypes.string,
  logoutOtherUsers: PropTypes.bool,
  msg: PropTypes.object.isRequired,
  dismissConsoleError: PropTypes.func.isRequired,
  openConsole: PropTypes.func.isRequired,
}

export default connect(
  ({
    consoles: {
      errors: [{
        vmId,
        vmName,
        consoleType,
        status,
        logoutOtherUsers,
      } = {}] = [],
    },
  }) => ({
    vmId,
    vmName,
    consoleType,
    status,
    logoutOtherUsers,
  })
  ,
  (dispatch) => ({
    dismissConsoleError: ({ vmId, consoleType }) => dispatch(Actions.dismissConsoleError({ vmId, consoleType })),
    openConsole: ({
      vmId,
      skipSSO,
      consoleType,
      logoutOtherUsers,
    }) => dispatch(Actions.openConsole({
      vmId,
      skipSSO,
      consoleType,
      logoutOtherUsers,
    }))
    ,
  }))(withMsg(ConsoleNotificationsDialog))
