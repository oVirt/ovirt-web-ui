import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { push } from 'connected-react-router'

import style from './style.css'
import VncConsole from '_/react-console'
import { setConsoleStatus, getRDP } from '_/actions'
import ConsoleConfirmationModal from '../VmActions/ConsoleConfirmationModal'
import { INIT_CONSOLE, DOWNLOAD_CONSOLE, DISCONNECTED_CONSOLE } from '_/constants'
import { Button } from 'patternfly-react'
import { msg } from '_/intl'

import Loader, { SIZES } from '../Loader'

import { isRunning } from '../utils'

import downloadIcon from './images/download_icon.svg'
import disconnectIcon from './images/disconnect_icon.svg'

const RDP_ID = 'rdp'

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
  secondaryText: PropTypes.string.isRequired,
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
    }
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
  }

  render () {
    const { vmId, config, consoleId, vms, onDisconnected } = this.props
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
          return <VncConsole
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
            toolbarContainer='vm-console-toolbar-sendkeys'
            onDisconnected={onDisconnected}
          />
        }
        break
      case DOWNLOAD_CONSOLE:
        return <InfoPageContainer icon={downloadIcon} mainText={msg.downloadedVVFile()} secondaryText={msg[`downloaded${currentConsole.get('protocol').toUpperCase()}`]()} />
      case DISCONNECTED_CONSOLE:
        return <InfoPageContainer
          icon={disconnectIcon}
          mainText={msg.disconectedConsole()}
          secondaryText={msg.disconectedConsoleInfo()}
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
}

export default connect(
  (state) => ({
    consoles: state.consoles,
    vms: state.vms,
    config: state.config,
  }),
  (dispatch, { vmId }) => ({
    onDisconnected: () => dispatch(setConsoleStatus({ vmId, status: DISCONNECTED_CONSOLE })),
    onShutdown: () => dispatch(push(`/vm/${vmId}`)),
    onRDP: ({ domain, username, vms }) => dispatch(getRDP({ name: vms.getIn(['vms', vmId, 'name']), fqdn: vms.getIn(['vms', vmId, 'fqdn']), domain, username })),
  })
)(VmConsole)
