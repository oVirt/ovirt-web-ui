import $ from 'jquery'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import ReactDOM from 'react-dom'

import FieldHelp from '../FieldHelp/index'

import {
  getSSHKey,
  saveSSHKey,
} from './actions'

import { msg } from '../../intl'

class OptionsDialog extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      sshKey: props.optionsDialog.get('sshKey') || '',
    }
    this.onSSHKeyChange = this.onSSHKeyChange.bind(this)
    this.onSaveClick = this.onSaveClick.bind(this)
  }

  componentDidMount () {
    const dom = ReactDOM.findDOMNode(this)
    $(dom).on('show.bs.modal', function (e) {
      this.setState({ 'sshKey': 'Loading...' })
      if (this.props.userId) {
        this.props.getSSH()
      }
    }.bind(this))
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
      <div className='modal fade' tabIndex='-1' role='dialog' id='options-modal' aria-hidden='true' aria-labelledby='optionsModalLabel'>
        <div className='modal-dialog' role='document'>
          <div className='modal-content'>
            <div className='modal-header'>
              <button type='button' className='close' data-dismiss='modal' aria-label='Close' id={`${idPrefix}-button-close`}><span aria-hidden='true'>&times;</span></button>
              <h4 className='modal-title' id={`${idPrefix}-title`}>{msg.options()}</h4>
            </div>
            <div className='modal-body' id={`${idPrefix}-body`}>
              {content}
            </div>
            <div className='modal-footer'>
              {this.props.userId ? <button type='button' onClick={this.onSaveClick} className='btn btn-default' data-dismiss='modal' id={`${idPrefix}-button-save`}>{msg.save()}</button> : null}
              <button type='button' className='btn btn-danger' data-dismiss='modal' id={`${idPrefix}-button-cancel`}>
                {msg.cancel()}
              </button>
            </div>
          </div>
        </div>
      </div>
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
