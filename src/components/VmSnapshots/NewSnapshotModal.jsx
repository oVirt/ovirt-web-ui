import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, Icon, FormControl } from 'patternfly-react'
import { msg } from '../../intl'

class NewSnapshotModal extends Component {
  constructor (props) {
    super(props)
    this.state = { showModal: false, description: '' }
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this)
  }

  open () {
    this.setState({ showModal: true })
  }

  close () {
    this.setState({ showModal: false, description: '' })
  }

  handleDescriptionChange (e) {
    this.setState({ description: e.target.value })
  }

  handleSave () {
    const snapshot = {
      description: this.state.description,
    }
    this.props.onAdd({ snapshot })
    this.close()
  }

  render () {
    return (
      <div>
        <Button bsStyle='default' bsSize='small' onClick={this.open}>
          { msg.newSnapshot() }
        </Button>

        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header>
            <button
              className='close'
              onClick={this.close}
              aria-hidden='true'
              aria-label='Close'
            >
              <Icon type='pf' name='close' />
            </button>
            <Modal.Title>{ msg.addNewSnapshot() }</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className='form-horizontal'>
              <div className='form-group col-sm-12'>
                <label className='col-sm-3 control-label'>
                  { msg.description() }
                </label>
                <div className='col-sm-9'>
                  <FormControl
                    type='text'
                    value={this.state.description}
                    onChange={this.handleDescriptionChange}
                  />
                </div>
              </div>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              bsStyle='default'
              className='btn-cancel'
              onClick={this.close}
            >
              { msg.cancel() }
            </Button>
            <Button bsStyle='primary' onClick={this.handleSave}>
              { msg.ok() }
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

NewSnapshotModal.propTypes = {
  onAdd: PropTypes.func.isRequired,
}

export default NewSnapshotModal
