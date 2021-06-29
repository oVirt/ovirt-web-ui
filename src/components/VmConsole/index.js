import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { push } from 'connected-react-router'
import $ from 'jquery'

import style from './style.css'
import * as Actions from '_/actions'
import * as C from '_/constants'
import { Button } from 'patternfly-react'
import { VncConsole } from '@patternfly/react-console'
import { withMsg } from '_/intl'
import CounterAlert from '_/components/CounterAlert'

import Loader, { SIZES } from '../Loader'

import { isRunning } from '../utils'
import { isNativeConsole } from '_/utils/console'

import downloadIcon from './images/download_icon.png'
import disconnectIcon from './images/disconnect_icon.png'
import { toJS } from '_/helpers'

const NOVNC_CONTAINER_ID = 'novnc-console-container'

const InfoPageContainer = ({ mainText, secondaryText, icon, secondaryComponent }) => (
  <div className={style['download-page-container']}>
    <div className={style['download-page-content']}>
      <img src={icon} />
      <span className={style['download-page-main-text']}>{ mainText }</span>
      <span className={style['download-page-secondary-text']}>{ secondaryText }</span>
      { secondaryComponent && (
        <span className={style['download-page-secondary-text']}>
          { secondaryComponent }
        </span>
      )}
    </div>
  </div>
)

InfoPageContainer.propTypes = {
  mainText: PropTypes.string.isRequired,
  secondaryText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.string.isRequired,
  secondaryComponent: PropTypes.node,
}

const VmConsole = ({
  consoleType,
  vmId,
  vm,
  websocketPort,
  websocketHost,
  vmConsoleState,
  msg,
  onDisconnected,
  goToDetails,
  openConsole,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false)
  const isVmRunning = isRunning(vm.get('status'))

  const {
    proxyTicket,
    ticket,
    [consoleType]: {
      status: consoleStatus,
      reason: disconnectReason,
    } = {},
  } = toJS(vmConsoleState) || {}

  const getNativeConsoleMessages = () => {
    switch (consoleType) {
      case C.RDP:
        return [msg.downloadedRDPFile(), msg.downloadedRDP()]
      case C.NATIVE_VNC:
        return [msg.downloadedVVFile(), msg.downloadedVNC()]
      case C.SPICE:
        return [msg.downloadedVVFile(), msg.downloadedSPICE()]
      default:
        return []
    }
  }

  useEffect(() => {
    if (!isVmRunning) {
      goToDetails()
    }
  }, [isVmRunning, goToDetails])

  useEffect(() => {
    if (!consoleStatus) {
      openConsole()
    }
  }, [consoleStatus, openConsole])

  useEffect(() => {
    const onFullScreen = () => {
      const elem = document.getElementById('console-component')
      if (!elem) {
        return
      }

      elem.onfullscreenchange = (event) => {
        const elem = event.target
        const isConsoleFullscreen = document.fullscreenElement === elem
        if (!isConsoleFullscreen) {
          setIsFullScreen(false)
        }
      }

      if (elem.requestFullscreen) {
        elem.requestFullscreen()
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen()
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen()
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen()
      }
    }
    if (isFullScreen) {
      onFullScreen()
    }
  }, [isFullScreen])

  if (!isVmRunning) {
    return null
  }

  if (consoleType === C.BROWSER_VNC && ticket && websocketHost) {
    switch (consoleStatus) {
      case C.INIT_CONSOLE:
        return (
          <div id='console-component' className={isFullScreen ? style['full-screen'] : null}>
            {isFullScreen && (
              <div className={style['toast-message']}>
                <CounterAlert timeout={5} type='info' title={msg.pressF11ExitFullScreen()} />
              </div>
            )}
            <VncConsole
              encrypt
              resizeSession
              scaleViewport
              textConnecting={<Loader loaderText={msg.connecting()} size={SIZES.SMALL} />}
              textDisconnect={msg.disconnect()}
              textSendShortcut={msg.sendShortcutKey()}
              textCtrlAltDel={msg.sendCtrlAltDel()}
              credentials={{ password: ticket.value }}
              path={proxyTicket}
              host={websocketHost}
              port={websocketPort}
              portalToolbarTo='vm-console-toolbar-sendkeys'
              consoleContainerId={NOVNC_CONTAINER_ID}
              onDisconnected={
                (e) => !e?.detail?.clean ? onDisconnected('CONNECTION_FAILURE') : onDisconnected()
              }
              onConnected={() => $(`#${NOVNC_CONTAINER_ID} canvas`).focus()}
              additionalButtons={[
                <Button
                  key='full-screen'
                  bsStyle='default'
                  onClick={() => setIsFullScreen(true)}
                >
                  {msg.fullScreen()}
                </Button>,
              ]}
            />
          </div>
        )
      case C.DISCONNECTED_CONSOLE:
        return (
          <InfoPageContainer
            icon={disconnectIcon}
            mainText={msg.disconectedConsole()}
            secondaryText={disconnectReason === 'CONNECTION_FAILURE' ? <span dangerouslySetInnerHTML={{ __html: msg.connectionFailConsoleInfo() }} /> : msg.disconectedConsoleInfo()}
            secondaryComponent={<Button bsStyle='primary' onClick={openConsole}>{ msg.connect() }</Button>}
          />
        )
    }
  }

  if (isNativeConsole(consoleType) && consoleStatus === C.DOWNLOAD_CONSOLE) {
    const [nativeMainText, nativeSecondaryText] = getNativeConsoleMessages()
    return (
      <InfoPageContainer
        icon={downloadIcon}
        mainText={nativeMainText}
        secondaryText={nativeSecondaryText}
      />
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

  onDisconnected: PropTypes.func.isRequired,
  goToDetails: PropTypes.func.isRequired,
  openConsole: PropTypes.func.isRequired,
}

export default connect(
  ({ consoles, vms, config }, { vmId }) => ({
    vmConsoleState: consoles.getIn(['vms', vmId]),
    vm: vms.getIn(['vms', vmId]),
    websocketPort: config.getIn(['websocket', 'port']),
    websocketHost: config.getIn(['websocket', 'host']),
  }),
  (dispatch, { vmId, consoleType }) => ({
    onDisconnected: (reason) => dispatch(Actions.setConsoleStatus({ vmId, status: C.DISCONNECTED_CONSOLE, reason, consoleType: C.BROWSER_VNC })),
    goToDetails: () => dispatch(push(`/vm/${vmId}`)),
    openConsole: () => dispatch(
      Actions.openConsole({
        vmId,
        consoleType,
        openInPage: true,
      })),

  })
)(withMsg(VmConsole))
