import React from 'react'
import { Modal, Button, ModalVariant } from '@patternfly/react-core'
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
    return (
      <>
        <Button variant='link' onClick={this.open} isDisabled={disabled}>
          { msg.consoleInstructions() }
        </Button>

        <Modal
          isOpen={this.state.showModal}
          variant={ModalVariant.medium}
          id={'vm-console-connection-open-modal'}
          onClose={this.close}
          title={ msg.consoleInstructions() }
        >
          <>
            <h3>{ msg.remoteViewerConnection() }</h3>
            <p>{ msg.usingRemoteViewer() }</p>
            <p>{ msg.remoteViewerAvailable() }</p>
            <div className={style['console-detail-container']}>
              <dl>
                <dt>RHEL, CentOS</dt><dd>sudo yum install virt-viewer</dd>
                <dt>Fedora</dt><dd>sudo dnf install virt-viewer</dd>
                <dt>Ubuntu, Debian</dt><dd>sudo apt-get install virt-viewer</dd>
                <dt>Windows</dt><dd>{ msg.downloadVirtManagerMSI() }</dd>
              </dl>
            </div>
          </>
        </Modal>
      </>
    )
  }
}

VmConsoleInstructionsModal.propTypes = {
  disabled: PropTypes.bool,
  msg: PropTypes.object.isRequired,
}

export default withMsg(VmConsoleInstructionsModal)
