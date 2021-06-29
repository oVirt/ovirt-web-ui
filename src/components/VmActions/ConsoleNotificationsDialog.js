import React from 'react'

import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'
import { toJS } from '_/helpers'
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
          body={msg.cantLogonToConsole({ vmName })}
          confirm={{
            title: msg.yes(),
            onClick: () => openConsole({
              skipSSO: true,
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
          body={msg.consoleInUseContinue({ vmName })}
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
  msg: PropTypes.object.isRequired,
  dismissConsoleError: PropTypes.func.isRequired,
  openConsole: PropTypes.func.isRequired,
}

export default connect(
  ({ consoles, vms }) => ({
    ...toJS(consoles.getIn(['errors', 0], {})),
  })
  ,
  (dispatch) => ({
    dismissConsoleError: ({ vmId, consoleType }) => dispatch(Actions.dismissConsoleError({ vmId, consoleType })),
    openConsole: ({
      skipSSO,
      vmId,
      consoleType,
      logoutOtherUsers,
    }) => dispatch(Actions.openConsole({
      consoleType,
      vmId,
      skipSSO,
      logoutOtherUsers,
    }))
    ,
  }))(withMsg(ConsoleNotificationsDialog))
