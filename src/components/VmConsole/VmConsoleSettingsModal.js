import React from 'react'
import { Icon, Modal, Button } from 'patternfly-react'
import style from './style.css'
import { msg } from '../../intl'
import ConsoleConfirmationModal from '../VmActions/ConsoleConfirmationModal'
import { ActionButtonWraper } from '../VmActions/Action'
import PropTypes from 'prop-types'

class VmConsoleSettingsModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showModal: false }
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
  }

  open () {
    this.setState({ showModal: true })
  }

  close () {
    this.setState({ showModal: false })
  }

  render () {
    const { consoleId, vm, disabled } = this.props
    const consoleConfirmation = <ConsoleConfirmationModal vm={vm} consoleId={consoleId} />
    return <div className={style['console-modal-box']}>
      <Button bsStyle='link' onClick={this.open} className={style['color-blue']} disabled={disabled}>
        { msg.remoteDesktopConnectionSettings() }
      </Button>

      <Modal show={this.state.showModal} onHide={this.close} dialogClassName={style['create-snapshot-container']} id={'vm-console-connection-open-modal'}>
        <Modal.Header>
          <button
            className='close'
            onClick={this.close}
            aria-hidden='true'
            aria-label='Close'
            id='vm-console-connection-open-modal-close'
          >
            <Icon type='pf' name='close' />
          </button>
          <Modal.Title>{ msg.remoteDesktopConnectionSettings() }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={style['modal-container']}>
            <h3>{ msg.remoteDesktopViewerConnection() }</h3>
            <div>{ msg.usingRemoteViewer() }</div>
            <div>{ msg.remoteDesktopViewerAvailable() }</div>
            <div className={style['console-detail-container']}>
              <dl>
                <dt>RHEL, CentOS</dt><dd>sudo yum install virt-viewer</dd>
                <dt>Fedora</dt><dd>sudo dnf install virt-viewer</dd>
                <dt>Ubuntu, Debian</dt><dd>sudo apt-get install virt-viewer</dd>
                <dt>Windows</dt><dd>{ msg.downloadVirtManagerMSI() }</dd>
              </dl>
            </div>
            <ActionButtonWraper className='btn btn-default' confirmation={consoleConfirmation} shortTitle={msg.downloadVVFile()} id='vm-console-connection-download-button' />
          </div>
        </Modal.Body>
      </Modal>
    </div>
  }
}

VmConsoleSettingsModal.propTypes = {
  vm: PropTypes.object.isRequired,
  consoleId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
}

export default VmConsoleSettingsModal
