import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { addVmSnapshot } from './actions'

import {
  Alert,
  Button,
  Col,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  Checkbox,
  Icon,
  Modal,
  noop,
} from 'patternfly-react'
import { withMsg } from '_/intl'
import style from './style.css'

class NewSnapshotModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showModal: false,
      description: '',
      emptyDescription: false,
      saveMemory: !!props.isVmRunning,
    }
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this)
    this.handleSaveMemoryChange = this.handleSaveMemoryChange.bind(this)
  }

  open () {
    this.setState({ showModal: true })
  }

  close () {
    this.setState({ showModal: false, description: '', emptyDescription: false })
  }

  handleDescriptionChange (e) {
    this.setState({ description: e.target.value })
  }

  handleSaveMemoryChange (e) {
    this.setState({ saveMemory: e.target.checked })
  }

  handleSave (e) {
    e.preventDefault()
    if (this.state.description.trim().length > 0) {
      const snapshot = {
        description: this.state.description,
        persistMemoryState: this.state.saveMemory,
      }
      this.props.onAdd({ snapshot })
      this.close()
    } else {
      this.setState({ emptyDescription: true })
    }
  }

  render () {
    const { idPrefix, msg } = this.props

    let modalId = `${idPrefix}-modal`

    return (
      <div>
        <a onClick={this.props.disabled ? noop : this.open} id={`${idPrefix}-button`} className={`${this.props.disabled && 'disabled'}`}>
          <Icon type='fa' name='plus' />
          { msg.createSnapshot() }
        </a>

        <Modal show={this.state.showModal} onHide={this.close} dialogClassName={style['create-snapshot-container']} id={modalId}>
          <Modal.Header>
            <button
              className='close'
              onClick={this.close}
              aria-hidden='true'
              aria-label={msg.close()}
              id={`${modalId}-close`}
            >
              <Icon type='pf' name='close' />
            </button>
            <Modal.Title>{ msg.createSnapshot() }</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleSave} horizontal>
              <Col sm={12}>
                <Alert type='info'>
                  { msg.snapshotInfo() }
                </Alert>
              </Col>
              <FormGroup bsClass='form-group col-sm-12 required' validationState={this.state.emptyDescription ? 'error' : null}>
                <label className='col-sm-3 control-label'>
                  { msg.name() }
                </label>
                <div className='col-sm-9'>
                  <FormControl
                    type='text'
                    value={this.state.description}
                    onChange={this.handleDescriptionChange}
                    id={`${modalId}-description-edit`}
                  />
                  {
                    this.state.emptyDescription &&
                    <HelpBlock>
                      {msg.emptySnapshotDescription()}
                    </HelpBlock>
                  }
                </div>
              </FormGroup>
              {
                this.props.isVmRunning &&
                <FormGroup bsClass='form-group col-sm-12'>
                  <label className='col-sm-3 control-label'>
                    {msg.saveMemory()}
                  </label>
                  <div className='col-sm-9'>
                    <Checkbox
                      id={`${idPrefix}-snapshot-save-memory`}
                      checked={this.state.saveMemory}
                      onChange={this.handleSaveMemoryChange}
                    />
                  </div>
                </FormGroup>
              }
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              bsStyle='default'
              className='btn-cancel'
              onClick={this.close}
              id={`${modalId}-cancel`}
            >
              { msg.cancel() }
            </Button>
            <Button bsStyle='primary' onClick={this.handleSave} id={`${modalId}-create`}>
              { msg.create() }
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

NewSnapshotModal.propTypes = {
  vmId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  idPrefix: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  isVmRunning: PropTypes.bool,
  msg: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({}),
  (dispatch, { vmId }) => ({
    onAdd: ({ snapshot }) => dispatch(addVmSnapshot({ vmId, snapshot })),
  })
)(withMsg(NewSnapshotModal))
