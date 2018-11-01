import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, Icon } from 'patternfly-react'
import SelectBox from '../SelectBox'
import { msg } from 'app-intl'

const EMPTY_ID = ''

class NewNicModal extends Component {
  constructor (props) {
    super(props)
    const defaultVnicProfileId = EMPTY_ID
    this.state = { showModal: false, vnicProfileId: defaultVnicProfileId }
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.handleSave = this.handleSave.bind(this)
    this.handleVnicProfileChange = this.handleVnicProfileChange.bind(this)
  }

  open () {
    this.setState({ showModal: true })
  }

  close () {
    this.setState({ showModal: false })
  }

  handleVnicProfileChange (value) {
    this.setState({ vnicProfileId: value })
  }

  handleSave () {
    const nic = {
      name: this.props.nextNicName,
      vnicProfile: {
        id: this.state.vnicProfileId,
      },
    }
    this.props.onAdd({ nic })
    this.close()
  }

  render () {
    let { vnicProfiles } = this.props

    let preparedVnicProfiles = [ { id: EMPTY_ID, value: msg.vnicProfileEmpty() }, ...vnicProfiles.toList().map(item => (
      {
        id: item.get('id'),
        value: `${item.getIn(['network', 'name'])}/${item.get('name')}`,
      }
    )).toJS()]

    return (
      <div>
        <Button bsStyle='default' bsSize='small' onClick={this.open}>
          { msg.newNic() }
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
            <Modal.Title>{ msg.addNewNic() }</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className='form-horizontal'>
              <div className='form-group col-sm-12'>
                <label className='col-sm-3 control-label'>
                  { msg.vnicProfile() }
                </label>
                <div className='col-sm-9'>
                  <SelectBox
                    selected={EMPTY_ID}
                    idPrefix='vnicProfiles-select'
                    sort
                    items={preparedVnicProfiles}
                    onChange={this.handleVnicProfileChange}
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

NewNicModal.propTypes = {
  nextNicName: PropTypes.string.isRequired,
  vnicProfiles: PropTypes.object.isRequired,
  onAdd: PropTypes.func.isRequired,
}

export default NewNicModal
