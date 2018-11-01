import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Modal } from 'patternfly-react'

import FieldHelp from '../FieldHelp/index'

import {
  getSSHKey,
  saveSSHKey,
} from './actions'

import { msg } from 'app-intl'

class OptionsDialog extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sshKey: props.optionsDialog.get('sshKey') || '',
      openModal: false,
    }
    this.onSSHKeyChange = this.onSSHKeyChange.bind(this)
    this.onSaveClick = this.onSaveClick.bind(this)
    this.handleModalOpen = this.handleModalOpen.bind(this)
  }

  handleModalOpen () {
    if (this.props.userId) {
      this.props.getSSH()
    }
    this.setState({ 'sshKey': 'Loading...', openModal: true })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.optionsDialog.get('loaded')) {
      this.setState({ 'sshKey': nextProps.optionsDialog.get('sshKey') })
    }
  }

  onSSHKeyChange (event) {
    this.setState({ sshKey: event.target.value })
  }

  onSaveClick () {
    this.props.onSave({ key: this.state.sshKey, sshId: this.props.optionsDialog.get('sshId') })
    this.setState({ openModal: false })
  }

  render () {
    const { oVirtApiVersion } = this.props
    const idPrefix = `optionsdialog`

    let content = (
      <form>
        <div className='form-group'>
          <FieldHelp content={msg.publicSSHKey()} text={msg.SSHKey()} />
          <textarea
            type='text'
            className='form-control'
            rows='7'
            onChange={this.onSSHKeyChange}
            value={this.state.sshKey || ''}
            id={`${idPrefix}-sshkey`} />
        </div>
      </form>
    )

    if (!this.props.userId) {
      const apiVersion = oVirtApiVersion && oVirtApiVersion.get('major')
        ? `${oVirtApiVersion.get('major')}.${oVirtApiVersion.get('minor')}`
        : 'unknown'

      content = (
        <div>
          <p id={`${idPrefix}-lowversion`}>{msg.lowOVirtVersion({ apiVersion })}</p>
        </div>
      )
    }
    return (
      <React.Fragment>
        <a id='usermenu-options' href='#' onClick={this.handleModalOpen}>{msg.options()}</a>
        { this.state.openModal &&
          <Modal onHide={() => this.setState({ openModal: false })} show>
            <Modal.Header>
              <Modal.CloseButton onClick={() => this.setState({ openModal: false })} />
              <Modal.Title id={`${idPrefix}-title`}>{msg.options()}</Modal.Title>
            </Modal.Header>
            <Modal.Body id={`${idPrefix}-body`}>
              {content}
            </Modal.Body>
            <Modal.Footer>
              {this.props.userId ? <button type='button' onClick={this.onSaveClick} className='btn btn-default' id={`${idPrefix}-button-save`}>{msg.save()}</button> : null}
              <button onClick={() => this.setState({ openModal: false })} type='button' className='btn btn-danger' id={`${idPrefix}-button-cancel`}>
                {msg.cancel()}
              </button>
            </Modal.Footer>
          </Modal>
        }
      </React.Fragment>
    )
  }
}

OptionsDialog.propTypes = {
  userId: PropTypes.string,
  optionsDialog: PropTypes.object.isRequired,
  oVirtApiVersion: PropTypes.object,
  getSSH: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    optionsDialog: state.OptionsDialog,
    oVirtApiVersion: state.config.get('oVirtApiVersion'),
  }),
  (dispatch, { userId }) => ({
    getSSH: () => dispatch(getSSHKey({ userId })),
    onSave: ({ key, sshId }) => dispatch(saveSSHKey({ key, userId, sshId })),
  })
)(OptionsDialog)
