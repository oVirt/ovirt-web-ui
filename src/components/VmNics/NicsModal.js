import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, Icon } from 'patternfly-react'
import SelectBox from '../SelectBox'
import { msg } from '../../intl'

class NicsModal extends Component {
  constructor (props) {
    super(props)
    const defaultVnicProfileId = props.vnicProfiles.get('vnicProfiles').findKey((value) => value.get('name') === 'ovirtmgmt')
    this.state = { showModal: false, vnicProfile: defaultVnicProfileId }
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
    this.setState({ vnicProfile: value })
  }

  handleSave () {
    const nic = {
      name: this.props.nextNicName,
      vnicProfile: {
        id: this.state.vnicProfile,
      },
    }
    this.props.onAdd({ nic })
    this.close()
  }

  render () {
    let { vnicProfiles, networks } = this.props

    return (
      <div>
        <Button bsStyle='default' bsSize='small' onClick={this.open}>
          { msg.New() }
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
                  <SelectBox items={
                      vnicProfiles.get('vnicProfiles').map((value, key) => (
                        {
                          id: key,
                          value: `${networks.getIn(['networks', value.getIn(['network', 'id'])]).get('name')}/${value.get('name')}`,
                        }
                      )).toJS()
                    }
                    selected={
                      vnicProfiles.get('vnicProfiles').findKey((value) => value.get('name') === 'ovirtmgmt')
                    }
                    idPrefix='vnicProfiles-select'
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

NicsModal.propTypes = {
  nextNicName: PropTypes.string.isRequired,
  vnicProfiles: PropTypes.object.isRequired,
  networks: PropTypes.object.isRequired,
  onAdd: PropTypes.func.isRequired,
}

export default NicsModal
