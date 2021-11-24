import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { addVmSnapshot } from './actions'

import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  Hint,
  HintBody,
  Modal,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core'
import { withMsg } from '_/intl'
import { PlusIcon } from '@patternfly/react-icons/dist/esm/icons'

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

  handleDescriptionChange (value) {
    this.setState({ description: value })
  }

  handleSaveMemoryChange (checked) {
    this.setState({ saveMemory: checked })
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
        <a onClick={this.props.disabled ? () => {} : this.open} id={`${idPrefix}-button`} className={`${this.props.disabled && 'disabled'}`}>
          <PlusIcon/>
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
          <Form onSubmit={this.handleSave} isHorizontal>
            <Hint >
              <HintBody>
                {msg.snapshotInfo() }
              </HintBody>
            </Hint>
            <FormGroup
              label={ msg.name() }
              validated={this.state.emptyDescription ? 'error' : null}
              helperTextInvalid={msg.emptySnapshotDescription()}
              fieldId={`${modalId}-description-edit`}
            >
              <TextInput
                type='text'
                value={this.state.description}
                onChange={this.handleDescriptionChange}
                id={`${modalId}-description-edit`}
              />
            </FormGroup>
            {
                this.props.isVmRunning && (
                  <FormGroup
                    label={msg.saveMemory()}
                    fieldId={`${idPrefix}-snapshot-save-memory`}
                  >
                    <Checkbox
                      id={`${idPrefix}-snapshot-save-memory`}
                      isChecked={this.state.saveMemory}
                      onChange={this.handleSaveMemoryChange}
                    />
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
