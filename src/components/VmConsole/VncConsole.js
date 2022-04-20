import React, { useRef, useState, useEffect } from 'react'

import PropTypes from 'prop-types'
import { css } from '@patternfly/react-styles'
import { Button, EmptyState, EmptyStateBody, EmptyStateIcon, Spinner } from '@patternfly/react-core'

import { initLogging } from '@novnc/novnc/core/util/logging'
import RFB from '@novnc/novnc/core/rfb'

import {
  VncActions,
  constants,
} from '@patternfly/react-console'

import styles from '@patternfly/react-styles/css/components/Consoles/VncConsole'
import '@patternfly/react-styles/css/components/Consoles/VncConsole.css'

const { CONNECTED, CONNECTING, DISCONNECTED } = constants

const VncConsole = ({
  children,
  host,
  port = '80',
  path = '',
  encrypt = false,
  resizeSession = true,
  scaleViewport = false,
  viewOnly = false,
  shared = false,
  credentials,
  repeaterID = '',
  vncLogging = 'warn',
  consoleContainerId,
  additionalButtons = [],
  onDisconnected = () => {},
  onInitFailed,
  onSecurityFailure,
  textConnect = 'Connect',
  textConnecting = 'Connecting',
  textDisconnected = 'Click Connect to open the VNC console.',
  textDisconnect = 'Disconnect',
  textSendShortcut,
  textCtrlAltDel,
}) => {
  const rfb = useRef()
  let novncStaticComponent
  let novncElem

  const [status, setStatus] = useState(CONNECTING)

  const addEventListeners = () => {
    if (rfb.current) {
      rfb.current?.addEventListener('connect', onConnected)
      rfb.current?.addEventListener('disconnect', _onDisconnected)
      rfb.current?.addEventListener('securityfailure', _onSecurityFailure)
    }
  }

  const removeEventListeners = () => {
    if (rfb.current) {
      rfb.current.removeEventListener('connect', onConnected)
      rfb.current.removeEventListener('disconnect', _onDisconnected)
      rfb.current.removeEventListener('securityfailure', _onSecurityFailure)
    }
  }

  const connect = () => {
    const protocol = encrypt ? 'wss' : 'ws'
    const url = `${protocol}://${host}:${port}/${path}`

    const options = {
      repeaterID,
      shared,
      credentials,
    }
    rfb.current = new RFB(novncElem, url, options)
    addEventListeners()
    rfb.current.viewOnly = viewOnly
    rfb.current.scaleViewport = scaleViewport
    rfb.current.resizeSession = resizeSession
  }

  useEffect(() => {
    initLogging(vncLogging)
    try {
      connect()
    } catch (e) {
      onInitFailed && onInitFailed(e)
      rfb.current = undefined
    }

    return () => {
      disconnect()
      removeEventListeners()
      rfb.current = undefined
    }
  }, [connect, onInitFailed, removeEventListeners, vncLogging])

  const disconnect = () => {
    if (!rfb.current) {
      return
    }
    rfb.current.disconnect()
  }

  const onConnected = () => {
    setStatus(CONNECTED)
  }

  const _onDisconnected = (e) => {
    setStatus(DISCONNECTED)
    onDisconnected(e)
  }

  const _onSecurityFailure = (e) => {
    setStatus(DISCONNECTED)
    onSecurityFailure(e)
  }

  const onCtrlAltDel = () => {
    if (rfb.current) {
      rfb?.current?.sendCtrlAltDel()
    }
  }

  let rightContent
  let emptyState
  switch (status) {
    case CONNECTED:
      rightContent = (
        <VncActions
          onCtrlAltDel={onCtrlAltDel}
          textSendShortcut={textSendShortcut}
          textCtrlAltDel={textCtrlAltDel}
          textDisconnect={textDisconnect}
          onDisconnect={disconnect}
          additionalButtons={additionalButtons}
        />
      )
      break
    case DISCONNECTED:
      emptyState = (
        <EmptyState>
          <EmptyStateBody>{textDisconnected}</EmptyStateBody>
          <Button variant="primary" onClick={connect}>
            {textConnect}
          </Button>
        </EmptyState>
      )
      break
    case CONNECTING:
    default:
      emptyState = (
        <EmptyState>
          <EmptyStateIcon variant="container" component={Spinner} />
          <EmptyStateBody>{textConnecting}</EmptyStateBody>
        </EmptyState>
      )
  }

  if (!novncStaticComponent) {
    novncStaticComponent = <div id={consoleContainerId} ref={e => (novncElem = e)} />
  }

  return (
    <>
      {rightContent}
      <div className={css(styles.consoleVnc)}>
        {children}
        <>
          <div>
            {emptyState}
            {novncStaticComponent}
          </div>
        </>
      </div>
    </>
  )
}
VncConsole.displayName = 'VncConsole'

VncConsole.propTypes = {
  /** Children nodes */
  children: PropTypes.any,

  /** FQDN or IP to connect to */
  host: PropTypes.string.isRequired,
  /** TCP Port */
  port: PropTypes.string,
  /** host:port/path */
  path: PropTypes.string,
  encrypt: PropTypes.bool,
  /** Is a boolean indicating if a request to resize the remote session should be sent whenever the container changes dimensions */
  resizeSession: PropTypes.bool,
  /** Is a boolean indicating if the remote session should be scaled locally so it fits its container */
  scaleViewport: PropTypes.bool,
  /** Is a boolean indicating if any events (e.g. key presses or mouse movement) should be prevented from being sent to the server */
  viewOnly: PropTypes.bool,
  /** Is a boolean indicating if the remote server should be shared or if any other connected clients should be disconnected */
  shared: PropTypes.bool,
  /** An Object specifying the credentials to provide to the server when authenticating
   * { username: '' password: '' target: ''}
   */
  credentials: PropTypes.object,
  /** A DOMString specifying the ID to provide to any VNC repeater encountered */
  repeaterID: PropTypes.string,
  /** log-level for noVNC */
  vncLogging: PropTypes.oneOf(['error', 'warn', 'none', 'debug', 'info']),
  consoleContainerId: PropTypes.string,
  additionalButtons: PropTypes.array,

  /** Callback. VNC server disconnected. */
  onDisconnected: PropTypes.func,
  /** Initialization of RFB failed */
  onInitFailed: PropTypes.func,
  /** Handshake failed */
  onSecurityFailure: PropTypes.func,

  /* Text content rendered inside the EmptyState in the "Connect' button for when console is disconnnected */
  textConnect: PropTypes.string,
  /* Text content rendered inside the EmptyState for when console is connecting */
  textConnecting: PropTypes.string,
  /* Text content rendered inside the EmptyState for when console is disconnnected */
  textDisconnected: PropTypes.string,
  /** Text content rendered inside the Disconnect button */
  textDisconnect: PropTypes.string,
  /** Text content rendered inside the button Send shortcut dropdown toggle */
  textSendShortcut: PropTypes.string,
  /** Text content rendered inside the Ctrl-Alt-Delete dropdown entry */
  textCtrlAltDel: PropTypes.string,
}

export default VncConsole
