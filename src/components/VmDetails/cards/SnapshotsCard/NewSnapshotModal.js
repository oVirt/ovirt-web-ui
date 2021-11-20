import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { addVmSnapshot } from './actions'

import {
  Col,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  Checkbox,
  Icon,
  noop,
} from 'patternfly-react'
import {
  Alert,
  Button,
  Modal,
  ModalVariant,
} from '@patternfly/react-core'
import { withMsg } from '_/intl'

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

    const modalId = `${idPrefix}-modal`

    return (
      <div>
        <a onClick={this.props.disabled ? noop : this.open} id={`${idPrefix}-button`} className={`${this.props.disabled && 'disabled'}`}>
          <Icon type='fa' name='plus' />
          { msg.createSnapshot() }
        </a>

        <Modal
          isOpen={this.state.showModal}
          onClose={this.close}
          id={modalId}
          title={ msg.createSnapshot() }
          variant={ModalVariant.small}
          position='top'
          actions={[
            <Button key='save' variant='primary' onClick={this.handleSave} id={`${modalId}-create`}>
              { msg.create() }
            </Button>,
            <Button
              variant='link'
              onClick={this.close}
              id={`${modalId}-cancel`}
              key='cancel'
            >
              { msg.cancel() }
            </Button>,

          ]}
        >
          <Form onSubmit={this.handleSave} horizontal>
            <Col sm={12}>
              <Alert
                variant='info'
                isInline
                title={msg.details()}
                style={{ 'margin-bottom': '10px' }}
              >
                {msg.snapshotInfo() }
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
                    this.state.emptyDescription && (
                      <HelpBlock>
                        {msg.emptySnapshotDescription()}
                      </HelpBlock>
                    )}
              </div>
            </FormGroup>
            {
                this.props.isVmRunning && (
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
                )}
          </Form>

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
