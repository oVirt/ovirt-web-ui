import React, { useRef, useState, useEffect, useCallback } from 'react'

import PropTypes from 'prop-types'

import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Spinner,
} from '@patternfly/react-core'

import { initLogging } from '@novnc/novnc/core/util/logging'
import RFB from '@novnc/novnc/core/rfb'

import {
  constants,
} from '@patternfly/react-console'

import { VncActions } from '@patternfly/react-console/dist/esm/components/VncConsole/VncActions'

const { CONNECTED, CONNECTING, DISCONNECTED } = constants

/**
 * Adapted from @patternfly/react-console/src/components/VncConsole/VncConsole.tsx
 * Commit: e0240737eb6abb091c3ac83c3de8fb68420d7578
 */
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
  onInitFailed = () => {},
  onSecurityFailure = () => {},
  textConnect = 'Connect',
  textConnecting = 'Connecting',
  textDisconnected = 'Click Connect to open the VNC console.',
  textDisconnect = 'Disconnect',
  textSendShortcut,
  textCtrlAltDel,
  wsProtocols = [],
  className,
  onConnected = () => {},
}) => {
  const rfb = useRef()
  const novncElem = useRef(null)
  // auto-connect when entering the page
  const [status, setStatus] = useState(CONNECTING)

  const setStatusConnected = useCallback(() => {
    setStatus(CONNECTED)
    onConnected()
  }, [setStatus, onConnected])

  const setStatusDisconnected = useCallback((e) => {
    setStatus(DISCONNECTED)
    onDisconnected(e)
  }, [setStatus, onDisconnected])

  const setStatusDisconnectedSecurityFailure = useCallback((e) => {
    setStatus(DISCONNECTED)
    onSecurityFailure(e)
  }, [setStatus, onSecurityFailure])

  const setStatusDisconnectedInitFailure = useCallback((e) => {
    setStatus(DISCONNECTED)
    onInitFailed(e)
  }, [setStatus, onInitFailed])

  const addEventListeners = useCallback(() => {
    rfb.current?.addEventListener('connect', setStatusConnected)
    rfb.current?.addEventListener('disconnect', setStatusDisconnected)
    rfb.current?.addEventListener('securityfailure', setStatusDisconnectedSecurityFailure)
  }, [setStatusConnected, setStatusDisconnected, setStatusDisconnectedSecurityFailure])

  const removeEventListeners = useCallback(() => {
    rfb.current?.removeEventListener('connect', setStatusConnected)
    rfb.current?.removeEventListener('disconnect', setStatusDisconnected)
    rfb.current?.removeEventListener('securityfailure', setStatusDisconnectedSecurityFailure)
  }, [setStatusConnected, setStatusDisconnected, setStatusDisconnectedSecurityFailure])

  const connect = useCallback(() => {
    try {
      const protocol = encrypt ? 'wss' : 'ws'
      const url = `${protocol}://${host}:${port}/${path}`

      const options = {
        repeaterID,
        shared,
        credentials,
        wsProtocols,
      }
      rfb.current = new RFB(novncElem.current, url, options)
      addEventListeners()
      rfb.current.viewOnly = viewOnly
      rfb.current.scaleViewport = scaleViewport
      rfb.current.resizeSession = resizeSession
    } catch (e) {
      rfb.current = undefined
      setStatusDisconnectedInitFailure(e)
    }
  }, [
    encrypt,
    host,
    port,
    path,
    repeaterID,
    shared,
    credentials,
    viewOnly,
    scaleViewport,
    resizeSession,
    wsProtocols,
    addEventListeners,
    setStatusDisconnectedInitFailure,
  ])

  useEffect(() => initLogging(vncLogging), [vncLogging])

  useEffect(() => {
    // side effect for CONNECTING state
    if (status === CONNECTING && !rfb.current) {
      connect()
    }
  }, [status, connect])

  useEffect(() => {
    // side effect for DISCONNECTED state
    if (status === DISCONNECTED && rfb.current) {
      removeEventListeners()
      rfb.current = undefined
    }
  }, [status, removeEventListeners])

  useEffect(() => {
    // reload listeners on any listener change (required because RFB uses Set to store callbacks)
    // cleanup listeners when leaving the page (in CONNECTED state rfb.current reference exists)
    addEventListeners()
    return () => removeEventListeners()
  }, [addEventListeners, removeEventListeners])

  useEffect(() => {
    // should be placed in the code after the effect that reloads listeners
    // cleanup when leaving the page (in CONNECTED state rfb.current reference exists)
    return () => rfb.current?.disconnect()
  }, [])

  // buttons are visible only in CONNECTED state
  const onCtrlAltDel = () => rfb.current?.sendCtrlAltDel()
  const disconnect = () => rfb.current?.disconnect() // callback will trigger state change

  const rightContent = (
    <VncActions
      onCtrlAltDel={onCtrlAltDel}
      textSendShortcut={textSendShortcut}
      textCtrlAltDel={textCtrlAltDel}
      textDisconnect={textDisconnect}
      onDisconnect={disconnect}
      additionalButtons={additionalButtons}
    />
  )

  const emptyStateDisconnected = (
    <EmptyState>
      <EmptyStateBody>{textDisconnected}</EmptyStateBody>
      <Button
        variant="primary"
        onClick={ () => setStatus(CONNECTING)}
      >
        {textConnect}
      </Button>
    </EmptyState>
  )

  const emptyStateConnecting = (
    <EmptyState>
      <EmptyStateIcon variant="container" component={Spinner} />
      <EmptyStateBody>{textConnecting}</EmptyStateBody>
    </EmptyState>
  )

  return (
    <>
      {status === CONNECTED && rightContent}
      <div className={`pf-c-console__vnc ${className}`}>
        {children}
        {status === DISCONNECTED && emptyStateDisconnected}
        {status === CONNECTING && emptyStateConnecting}
        {status !== DISCONNECTED && <div id={consoleContainerId} ref={novncElem} />}
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

  /** Properties not present in original @patternfly/react-console component */

  /** allows to re-enable legacy defaults: the non-standard 'binary' protocol required by Qemu < 5.0.0
   *  see https://github.com/novnc/noVNC/commit/c912230309806aacbae4295faf7ad6406da97617
  */
  wsProtocols: PropTypes.array,
  /** styling for the console placeholder - used to toggle fullscreen mode */
  className: PropTypes.string,
  /** Callback removed in PF4 version - used to move focus */
  onConnected: PropTypes.func,
}

export default VncConsole
