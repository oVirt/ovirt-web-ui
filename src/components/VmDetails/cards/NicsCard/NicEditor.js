import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  Col,
  ControlLabel,
  FieldLevelHelp,
  Form,
  FormControl,
  FormGroup,
  Modal,
  Radio,
} from 'patternfly-react'
import SelectBox from '../../../SelectBox'
import ExpandCollapseSection from '../../../ExpandCollapseSection'
import NicLinkStateIcon from './NicLinkStateIcon'

import { msg, enumMsg } from '_/intl'
import style from './style.css'

const EMPTY_ID = ''

const NIC_INTERFACES = [
  {
    id: 'rtl8139',
    value: enumMsg('NicInterface', 'rtl8139'),
  },
  {
    id: 'e1000',
    value: enumMsg('NicInterface', 'e1000'),
  },
  {
    id: 'virtio',
    value: enumMsg('NicInterface', 'virtio'),
  },
]
const NIC_INTERFACE_DEFAULT = 'virtio'
const NIC_INTERFACE_CANT_CHANGE = [ 'pci_passthrough' ]

const LabelCol = ({ children, ...props }) => {
  return <Col componentClass={ControlLabel} {...props}>
    { children }
  </Col>
}
LabelCol.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * Collect required information required to create a new NIC for a VM.
 *
 * Required data:
 *   - Name (auto name the next number higher?)
 *   - VNIC Profile (which includes the network) <-- needs to be on same DC and the VM
 *
 * Optional data:
 *   - Network Type (dual mode virtio and rtl8139, virtio, rtl8139, e1000)
 *     - NOTE: can only be changed if VM is down or Nic (card) is unplugged
 *   - Link State (Up = connected, Down = cable unplugged)
 */
class NicEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showModal: false,

      id: undefined,
      name: props.nextNicName,
      vnicProfileId: EMPTY_ID,
      interface: NIC_INTERFACE_DEFAULT,
      linked: true,
    }

    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.composeNic = this.composeNic.bind(this)
    this.changeName = this.changeName.bind(this)
    this.changeVnicProfile = this.changeVnicProfile.bind(this)
    this.changeInterface = this.changeInterface.bind(this)
    this.changeLinked = this.changeLinked.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  open (e) {
    e.preventDefault()

    const nic = this.props.nic
    if (nic) {
      this.setState({
        showModal: true,

        id: nic.id,
        name: nic.name,
        vnicProfileId: nic.vnicProfile.id,
        interface: nic.interface,
        linked: nic.linked,
      })
    } else {
      this.setState({
        showModal: true,

        id: undefined,
        name: this.props.nextNicName,
        vnicProfileId: EMPTY_ID,
        interface: NIC_INTERFACE_DEFAULT,
        linked: true,
      })
    }
  }

  close () {
    this.setState({ showModal: false })
  }

  composeNic () {
    const nic = {
      id: this.state.id,
      name: this.state.name,
      vnicProfile: {
        id: this.state.vnicProfileId,
      },
      interface: this.state.interface,
      linked: this.state.linked,
    }

    return nic
  }

  changeName ({ target: { value } }) {
    this.setState({ name: value })
  }

  changeVnicProfile (value) {
    this.setState({ vnicProfileId: value })
  }

  changeInterface (value) {
    this.setState({ interface: value })
  }

  changeLinked (value) {
    this.setState({ linked: !!value })
  }

  handleSave () {
    const newNic = this.composeNic()
    this.props.onSave(newNic)
    this.close()
  }

  render () {
    const { idPrefix, trigger, vmStatus, vnicProfileList } = this.props
    const modalId = idPrefix + '-modal'

    const createMode = !this.props.nic

    const vnicList = [
      {
        id: EMPTY_ID,
        value: msg.vnicProfileEmpty(),
      },
      ...vnicProfileList.map(
        item => ({
          id: item.get('id'),
          value: `${item.getIn(['network', 'name'])}/${item.get('name')}`,
        })
      ).toJS(),
    ]

    const nicInterface = NIC_INTERFACES.find(ni => ni.id === this.state.interface)
    const canChangeInterface =
      createMode ||
      (
        !NIC_INTERFACE_CANT_CHANGE.includes(this.props.nic.interface) &&
        (vmStatus === 'down' || !this.props.nic.plugged)
      )

    return <React.Fragment>
      {React.cloneElement(trigger, { onClick: this.open })}

      <Modal
        id={modalId}
        show={this.state.showModal}
        onHide={this.close}
      >
        <Modal.Header>
          <Modal.CloseButton onClick={this.close} id={`${modalId}-button-close`} />
          <Modal.Title>{createMode ? msg.addNewNic() : msg.editNic()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <Form
            horizontal
            onSubmit={e => { e.preventDefault() }}
            id={`${modalId}-form`}
          >
            <FormGroup controlId={`${modalId}-name`} className='required'>
              <LabelCol sm={3}>
                { msg.nicEditorNameLabel() }
              </LabelCol>
              <Col sm={9}>
                <FormControl
                  type='text'
                  defaultValue={this.state.name}
                  onChange={this.changeName}
                />
              </Col>
            </FormGroup>

            <FormGroup controlId={`${modalId}-vnic-profile`} className='required'>
              <LabelCol sm={3}>
                { msg.vnicProfile() }
              </LabelCol>
              <Col sm={9}>
                <SelectBox
                  id={`${modalId}-vnic-profile`}
                  items={vnicList}
                  selected={this.state.vnicProfileId}
                  onChange={this.changeVnicProfile}
                />
              </Col>
            </FormGroup>

            <ExpandCollapseSection id='nic-edit-advanced-options' sectionHeader={msg.advancedOptions()}>
              <FormGroup controlId={`${modalId}-interface`}>
                <LabelCol sm={3}>
                  { msg.nicEditorInterfaceLabel() }
                  { !canChangeInterface &&
                    <FieldLevelHelp
                      inline
                      content={msg.nicEditorInterfaceCantEditHelp()}
                      buttonClass={style['field-help']}
                    />
                  }
                </LabelCol>
                <Col sm={9}>
                  { !canChangeInterface &&
                    <div className={style['editor-value-text']} id={`${modalId}-interface`}>
                      { nicInterface ? nicInterface.value : 'N/A' }
                    </div>
                  }
                  { canChangeInterface &&
                    <SelectBox
                      id={`${modalId}-interface`}
                      items={NIC_INTERFACES}
                      selected={this.state.interface}
                      onChange={this.changeInterface}
                    />
                  }
                </Col>
              </FormGroup>
              <FormGroup controlId='nic-link-state-group'>
                <LabelCol sm={3}>
                  { msg.nicEditorLinkStateLabel() }
                </LabelCol>
                <Col sm={9}>
                  <Radio
                    id={`${modalId}-link-state-on`}
                    name='nic-link-state-group'
                    defaultChecked={this.state.linked}
                    onChange={() => { this.changeLinked(true) }}
                  >
                    { msg.nicEditorLinkStateUp() } <NicLinkStateIcon linkState idSuffix='up' showTooltip={false} />
                  </Radio>
                  <Radio
                    id={`${modalId}-link-state-off`}
                    name='nic-link-state-group'
                    defaultChecked={!this.state.linked}
                    onChange={() => { this.changeLinked(false) }}
                  >
                    { msg.nicEditorLinkStateDown() } <NicLinkStateIcon idSuffix='down' showTooltip={false} />
                  </Radio>
                </Col>
              </FormGroup>
            </ExpandCollapseSection>
          </Form>

        </Modal.Body>
        <Modal.Footer>
          <Button
            id={`${modalId}-button-cancel`}
            bsStyle='default'
            className='btn-cancel'
            onClick={this.close}
          >
            { msg.cancel() }
          </Button>
          <Button
            id={`${modalId}-button-ok`}
            bsStyle='primary'
            onClick={this.handleSave}>
            { msg.ok() }
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  }
}
NicEditor.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  nic: PropTypes.object,
  vmStatus: PropTypes.string,
  nextNicName: PropTypes.string,

  vnicProfileList: PropTypes.object.isRequired,
  trigger: PropTypes.element.isRequired,
  onSave: PropTypes.func.isRequired,
}

export default NicEditor
