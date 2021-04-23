import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { push } from 'connected-react-router'
import $ from 'jquery'

import style from './style.css'
import { setConsoleStatus, getRDP } from '_/actions'
import ConsoleConfirmationModal from '../VmActions/ConsoleConfirmationModal'
import { INIT_CONSOLE, DOWNLOAD_CONSOLE, DISCONNECTED_CONSOLE } from '_/constants'
import { Button } from 'patternfly-react'
import { VncConsole } from '@patternfly/react-console'
import { withMsg } from '_/intl'
import CounterAlert from '_/components/CounterAlert'

import Loader, { SIZES } from '../Loader'

import { isRunning } from '../utils'

import downloadIcon from './images/download_icon.png'
import disconnectIcon from './images/disconnect_icon.png'

const RDP_ID = 'rdp'
const NOVNC_CONTAINER_ID = 'novnc-console-container'

const InfoPageContainer = ({ mainText, secondaryText, icon, secondaryComponent }) => (
  <div className={style['download-page-container']}>
    <div className={style['download-page-content']}>
      <img src={icon} />
      <span className={style['download-page-main-text']}>{ mainText }</span>
      <span className={style['download-page-secondary-text']}>{ secondaryText }</span>
      { secondaryComponent &&
        <span className={style['download-page-secondary-text']}>
          { secondaryComponent }
        </span>
      }
    </div>
  </div>
)

InfoPageContainer.propTypes = {
  mainText: PropTypes.string.isRequired,
  secondaryText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.string.isRequired,
  secondaryComponent: PropTypes.node,
}

class VmConsole extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      vmId: props.vmId,
      consoleId: props.consoleId,
      isFirstRun: props.consoles.getIn(['vms', props.vmId]) === undefined,
      isFullScreen: false,
    }
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this)
    this.onFullScreen = this.onFullScreen.bind(this)
  }

  componentDidMount () {
    if (this.state.isFirstRun && this.props.consoleId === RDP_ID) {
      const domain = this.props.config.get('domain')
      const username = this.props.config.getIn([ 'user', 'name' ])
      this.props.onRDP({ domain, username, vms: this.props.vms })
      this.setState({ isFirstRun: false })
    }
  }

  componentDidUpdate () {
    if (!isRunning(this.props.vms.getIn(['vms', this.props.vmId, 'status']))) {
      this.props.onShutdown()
    }
    if (this.state.isFullScreen) {
      this.onFullScreen()
    }
  }

  onFullScreen () {
    var elem = document.getElementById('console-component')
    elem.onfullscreenchange = this.handleFullscreenChange
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

  handleFullscreenChange (event) {
    let elem = event.target
    let isFullscreen = document.fullscreenElement === elem

    if (!isFullscreen) {
      this.setState({ isFullScreen: false })
    }
  }

  render () {
    const { vmId, config, consoleId, vms, onDisconnected, msg } = this.props
    const { isFullScreen } = this.state
    const websocket = config.get('websocket')
    const vmConsole = this.props.consoles.getIn(['vms', vmId])
    if (consoleId === RDP_ID) {
      return <InfoPageContainer
        icon={downloadIcon}
        mainText={msg.downloadedRDPFile()}
        secondaryText={msg.downloadedRDP()}
      />
    }
    const currentConsole = vms.getIn(['vms', vmId, 'consoles']).find(c => c.get('id') === consoleId)
    if (this.state.isFirstRun) {
      return <div>
        <Loader loaderText={msg.loadingTripleDot()} size={SIZES.SMALL} />
        <ConsoleConfirmationModal
          vm={vms.getIn(['vms', vmId])}
          consoleId={consoleId}
          onClose={() => this.setState({ isFirstRun: false })}
          isConsolePage
          isNoVNC
          show
        />
      </div>
    }

    const proxyTicket = vmConsole && vmConsole.get('proxyTicket')
    const ticket = vmConsole && vmConsole.get('ticket')
    switch (vmConsole && vmConsole.get('consoleStatus')) {
      case INIT_CONSOLE:
        if (ticket !== undefined && websocket !== null) {
          return <div id='console-component' className={isFullScreen ? style['full-screen'] : null}>
            {isFullScreen &&
              <div className={style['toast-message']}>
                <CounterAlert timeout={5} type='info' title={msg.pressF11ExitFullScreen()} />
              </div>
            }
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
              host={websocket.get('host')}
              port={websocket.get('port')}
              portalToolbarTo='vm-console-toolbar-sendkeys'
              consoleContainerId={NOVNC_CONTAINER_ID}
              onDisconnected={
                (e) => !e.detail.clean ? onDisconnected('CONNECTION_FAILURE') : onDisconnected()
              }
              onConnected={() => $(`#${NOVNC_CONTAINER_ID} canvas`).focus()}
              additionalButtons={[
                <Button
                  key='full-screen'
                  bsStyle='default'
                  onClick={() => this.setState({ isFullScreen: true })}
                >
                  {msg.fullScreen()}
                </Button>,
              ]}
            />
          </div>
        }
        break

      case DOWNLOAD_CONSOLE:
        return <InfoPageContainer icon={downloadIcon} mainText={msg.downloadedVVFile()} secondaryText={msg[`downloaded${currentConsole.get('protocol').toUpperCase()}`]()} />

      case DISCONNECTED_CONSOLE:
        return <InfoPageContainer
          icon={disconnectIcon}
          mainText={msg.disconectedConsole()}
          secondaryText={vmConsole.get('reason') === 'CONNECTION_FAILURE' ? <span dangerouslySetInnerHTML={{ __html: msg.connectionFailConsoleInfo() }} /> : msg.disconectedConsoleInfo()}
          secondaryComponent={<Button bsStyle='primary' onClick={() => this.setState({ isFirstRun: true })}>{ msg.connect() }</Button>}
        />
    }
    return <div>
      <Loader loaderText={msg.loadingTripleDot()} size={SIZES.SMALL} />
    </div>
  }
}

VmConsole.propTypes = {
  consoleId: PropTypes.string.isRequired,
  vmId: PropTypes.string.isRequired,
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  consoles: PropTypes.object.isRequired,

  onDisconnected: PropTypes.func.isRequired,
  onShutdown: PropTypes.func.isRequired,
  onRDP: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    consoles: state.consoles,
    vms: state.vms,
    config: state.config,
  }),
  (dispatch, { vmId }) => ({
    onDisconnected: (reason) => dispatch(setConsoleStatus({ vmId, status: DISCONNECTED_CONSOLE, reason })),
    onShutdown: () => dispatch(push(`/vm/${vmId}`)),
    onRDP: ({ domain, username, vms }) => dispatch(getRDP({ name: vms.getIn(['vms', vmId, 'name']), fqdn: vms.getIn(['vms', vmId, 'fqdn']), domain, username })),
  })
)(withMsg(VmConsole))
