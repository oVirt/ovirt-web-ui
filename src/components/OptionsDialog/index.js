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
    $(dom).on('shown.bs.modal', function (e) {
      if (this.props.userId) {
        this.props.onOpen()
      }
    }.bind(this))
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ 'sshKey': nextProps.optionsDialog.get('sshKey') })
  }

  onSSHKeyChange (event) {
    this.setState({ sshKey: event.target.value })
  }

  onSaveClick () {
    this.props.onSave({ key: this.state.sshKey, sshId: this.props.optionsDialog.get('sshId') })
  }

  render () {
    let { oVirtApiVersion } = this.props
    let content = (
      <form>
        <div className='form-group'>
          <FieldHelp content='Your public SSH key.' text='SSH Key' />
          <textarea type='text' className='form-control' rows='7' onChange={this.onSSHKeyChange} value={this.state.sshKey || ''} />
        </div>
      </form>
    )

    if (!this.props.userId) {
      let apiVersion = 'unknown'
      if (oVirtApiVersion && oVirtApiVersion.get('major')) {
        apiVersion = `${oVirtApiVersion.get('major')}.${oVirtApiVersion.get('minor')}`
      }

      content = (
        <div>
          <p>SSH keys can not be managed with recent oVirt <strong>{apiVersion}</strong> version. Please upgrade oVirt to <strong>4.2</strong> or higher.</p>
        </div>
        )
    }
    return (
      <div className='modal fade' tabIndex='-1' role='dialog' id='options-modal' aria-hidden='true' aria-labelledby='optionsModalLabel'>
        <div className='modal-dialog' role='document'>
          <div className='modal-content'>
            <div className='modal-header'>
              <button type='button' className='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>
              <h4 className='modal-title'>Options</h4>
            </div>
            <div className='modal-body'>
              {content}
            </div>
            <div className='modal-footer'>
              {this.props.userId ? <button type='button' onClick={this.onSaveClick} className='btn btn-default' data-dismiss='modal'>Save</button> : null}
              <button type='button' className='btn btn-danger' data-dismiss='modal'>Cancel</button>
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
  onOpen: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    optionsDialog: state.OptionsDialog,
    oVirtApiVersion: state.config.get('oVirtApiVersion'),
  }),
  (dispatch, { userId }) => ({
    onOpen: () => dispatch(getSSHKey({ userId })),
    onSave: ({ key, sshId }) => dispatch(saveSSHKey({ key, userId, sshId })),
  })
)(OptionsDialog)
