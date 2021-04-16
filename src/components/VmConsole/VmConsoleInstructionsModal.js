import React from 'react'
import { Icon, Modal, Button } from 'patternfly-react'
import style from './style.css'
import { withMsg } from '../../intl'
import PropTypes from 'prop-types'

class VmConsoleInstructionsModal extends React.Component {
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
    const { disabled, msg } = this.props
    return <div className={style['console-modal-box']}>
      <Button bsStyle='link' onClick={this.open} className={style['color-blue']} disabled={disabled}>
        { msg.consoleInstructions() }
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
          <Modal.Title>{ msg.consoleInstructions() }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={style['modal-container']}>
            <h3>{ msg.remoteViewerConnection() }</h3>
            <div>{ msg.usingRemoteViewer() }</div>
            <div>{ msg.remoteViewerAvailable() }</div>
            <div className={style['console-detail-container']}>
              <dl>
                <dt>RHEL, CentOS</dt><dd>sudo yum install virt-viewer</dd>
                <dt>Fedora</dt><dd>sudo dnf install virt-viewer</dd>
                <dt>Ubuntu, Debian</dt><dd>sudo apt-get install virt-viewer</dd>
                <dt>Windows</dt><dd>{ msg.downloadVirtManagerMSI() }</dd>
              </dl>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  }
}

VmConsoleInstructionsModal.propTypes = {
  disabled: PropTypes.bool,
  msg: PropTypes.object.isRequired,
}

export default withMsg(VmConsoleInstructionsModal)
