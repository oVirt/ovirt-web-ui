import React from 'react'
import { Icon, Modal } from 'patternfly-react'
import style from '../VmDetails/cards/SnapshotsCard/style.css'
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
    const consoleConfirmation = <ConsoleConfirmationModal vm={this.props.vm} />
    return <div>
      <a onClick={this.open} id={`vm-console-connection-open-button`} >
        { msg.remoteDesktopConnectionSettings() }
      </a>

      <Modal show={this.state.showModal} onHide={this.close} dialogClassName={style['create-snapshot-container']} id={'vm-console-connection-open-modal'}>
        <Modal.Header>
          <button
            className='close'
            onClick={this.close}
            aria-hidden='true'
            aria-label='Close'
            id={`vm-console-connection-open-modal-close`}
          >
            <Icon type='pf' name='close' />
          </button>
          <Modal.Title>{ msg.remoteDesktopConnectionSettings() }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <h3>Remote Desctop Viever Connection</h3>
            <div> Here will go messaging and slyling</div>
            <ActionButtonWraper confirmation={consoleConfirmation} shortTitle={'Download'} id={'vm-console-connection-download-button'} />
          </div>
        </Modal.Body>
      </Modal>
    </div>
  }
}

VmConsoleSettingsModal.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default VmConsoleSettingsModal
