import React, {
  useEffect,
  useState,
} from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { push } from 'connected-react-router'

import style from './style.css'
import * as Actions from '_/actions'
import * as C from '_/constants'
import {
  Button,
} from '@patternfly/react-core'
import {
  AccessConsoles,
  constants,
} from '@patternfly/react-console'
import VncConsole from './VncConsole'
import { withMsg } from '_/intl'

import Loader, { SIZES } from '../Loader'

import { isRunning } from '../utils'

const NOVNC_CONTAINER_ID = 'novnc-console-container'

const focusOnConsole = () => document.querySelector(`#${NOVNC_CONTAINER_ID} canvas`)?.focus()
/**
 * Use cases with expected console states:
 * 1) happy path: INIT_CONSOLE
 *    when: console opened from different page, new credentials were fetched before
 * 2) direct via URL: <none> -> OPENING_IN_PROGRESS -> INIT_CONSOLE
 *    when: user visited the page directly via URL and credentials are being fetched as the page loads
 *    limitations: auto full screen won't work because it's not triggered via user gesture
 * 3) re-connect: INIT_CONSOLE -> DISCONNECTED_CONSOLE -> RECONNECTED_CONSOLE
 *    when: user opened the console, disconnected and connected again using the same credentials
 *    limitations: credentials will expire at some point
 */
const VmConsole = ({
  consoleType,
  vmId,
  vm,
  websocketPort,
  websocketHost,
  vmConsoleState,
  msg,
  fullScreenNoVnc,
  onDisconnected,
  goToDetails,
  openConsole,
  displayError,
  onReconnected,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(fullScreenNoVnc)
  const isVmRunning = isRunning(vm.get('status'))
  const onFailure = ({ reason, messageId }) => {
    console.warn('foo ', reason, messageId)
    onDisconnected('CONNECTION_FAILURE')
    displayError({
      messageDescriptor: {
        id: messageId,
        params: {
          reason: reason ?? '',
        },
      },
    })
  }

  const {
    proxyTicket,
    ticket,
    [consoleType]: {
      status: consoleStatus,
      reason: disconnectReason,
    } = {},
  } = vmConsoleState

  useEffect(() => {
    if (!isVmRunning || consoleType !== C.BROWSER_VNC) {
      goToDetails()
    }
  }, [isVmRunning, goToDetails, consoleType])

  useEffect(() => {
    // fetch credentials if page is accessed directly via URL
    if (!consoleStatus) {
      openConsole()
    }
  }, [consoleStatus, openConsole])

  useEffect(() => {
    const onFullScreen = () => {
      const elem = document.getElementById(NOVNC_CONTAINER_ID)
      const requestFullscreen = elem?.requestFullscreen ??
      elem?.mozRequestFullScreen ?? /* old Firefox */
      elem?.webkitRequestFullscreen ?? /* old Chrome, Safari & Opera */
      elem?.msRequestFullscreen /* old IE/Edge */

      if (!elem || !requestFullscreen) {
        setIsFullScreen(false)
        return
      }

      elem.onfullscreenchange = (event) => {
        const elem = event.target
        const isConsoleFullscreen = document.fullscreenElement === elem
        if (!isConsoleFullscreen) {
          setIsFullScreen(false)
        }
      }

      requestFullscreen.bind(elem)()?.catch?.((error) => {
        // ignore error if request was rejected - example cause on FF:
        // -> Request for fullscreen was denied because requesting element is no longer in its document.
        // -> Failed to execute 'requestFullscreen' on 'Element': API can only be initiated by a user gesture
        console.warn(error)
        // re-synchronize the flag with the display
        setIsFullScreen(false)
      })
    }
    if (isFullScreen) {
      onFullScreen()
    }
    focusOnConsole()
  }, [isFullScreen])

  if (!isVmRunning || consoleType !== C.BROWSER_VNC) {
    return null
  }

  if (consoleStatus === C.DISCONNECTED_CONSOLE || consoleStatus === C.INIT_CONSOLE || consoleStatus === C.RECONNECTED_CONSOLE) {
    return (
      <AccessConsoles preselectedType={constants.VNC_CONSOLE_TYPE}>
        <VncConsole
          encrypt
          shared
          resizeSession
          scaleViewport
          textConnect={msg.connect()}
          textConnecting={msg.connecting()}
          textDisconnected={
              disconnectReason === 'CONNECTION_FAILURE'
                ? msg.connectionFailConsoleInfo()
                : msg.disconectedConsoleInfo()
            }
          textDisconnect={msg.disconnect()}
          textSendShortcut={msg.sendShortcutKey()}
          textCtrlAltDel={msg.sendCtrlAltDel()}

          credentials={{ password: ticket.value }}
          path={proxyTicket}
          host={websocketHost}
          port={websocketPort}
          consoleContainerId={NOVNC_CONTAINER_ID}

          onDisconnected={(e) => e?.detail?.clean ? onDisconnected() : onDisconnected('CONNECTION_FAILURE')}
          onConnected={() => consoleStatus === C.INIT_CONSOLE ? focusOnConsole() : onReconnected() }
          wsProtocols={['binary']}
          className={isFullScreen ? style['full-screen'] : style['in-page']}

          onInitFailed={(e) => onFailure({ reason: e?.detail?.reason, messageId: 'vncConsoleInitializationFailed' })}
          onSecurityFailure={(e) => onFailure({ reason: e?.detail?.reason, messageId: 'vncConsoleHandshakeFailed' })}

          additionalButtons={[
            <Button
              key='full-screen'
              variant="secondary"
              onClick={() => setIsFullScreen(true)}
            >
              {msg.fullScreen()}
            </Button>,
          ]}
        />
      </AccessConsoles>
    )
  }

  return (
    <div>
      <Loader loaderText={msg.loadingTripleDot()} size={SIZES.SMALL} />
    </div>
  )
}

VmConsole.propTypes = {
  // own
  consoleType: PropTypes.string.isRequired,
  vmId: PropTypes.string.isRequired,

  // connected
  vm: PropTypes.object.isRequired,
  websocketPort: PropTypes.string,
  websocketHost: PropTypes.string,
  vmConsoleState: PropTypes.object,
  msg: PropTypes.object.isRequired,
  fullScreenNoVnc: PropTypes.bool.isRequired,

  onReconnected: PropTypes.func.isRequired,
  onDisconnected: PropTypes.func.isRequired,
  goToDetails: PropTypes.func.isRequired,
  openConsole: PropTypes.func.isRequired,
  displayError: PropTypes.func.isRequired,
}

export default connect(
  ({ consoles, vms, config, options }, { vmId }) => ({
    vmConsoleState: consoles?.vms?.[vmId] ?? {},
    vm: vms.getIn(['vms', vmId]),
    websocketPort: config.getIn(['websocket', 'port']),
    websocketHost: config.getIn(['websocket', 'host']),
    fullScreenNoVnc: options.getIn(['remoteOptions', 'fullScreenNoVnc', 'content']),
  }),
  (dispatch, { vmId, consoleType }) => ({
    onDisconnected: (reason) => dispatch(Actions.setConsoleStatus({ vmId, status: C.DISCONNECTED_CONSOLE, reason, consoleType: C.BROWSER_VNC })),
    onReconnected: () => dispatch(Actions.setConsoleStatus({ vmId, status: C.RECONNECTED_CONSOLE, consoleType: C.BROWSER_VNC })),
    goToDetails: () => dispatch(push(`/vm/${vmId}`)),
    openConsole: () => dispatch(
      Actions.openConsole({
        vmId,
        consoleType,
        openInPage: true,
      })),
    displayError: (message) => dispatch(Actions.addUserMessage({ ...message, type: 'error' })),
  })
)(withMsg(VmConsole))
