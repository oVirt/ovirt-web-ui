import React, { Component } from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  Form,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalVariant,
  TextInput,
  Radio,
} from '@patternfly/react-core'
import NicLinkStateIcon from './NicLinkStateIcon'

import { withMsg } from '_/intl'
import style from './style.css'
import { createNicInterfacesList, createVNicProfileList } from '_/components/utils'
import { EMPTY_VNIC_PROFILE_ID } from '_/constants'
import { InfoTooltip } from '_/components/tooltips'

const NIC_INTERFACE_DEFAULT = 'virtio'
const NIC_INTERFACE_CANT_CHANGE = ['pci_passthrough']

/**
 * Collect required information required to create a new NIC for a VM.
 *
 * Required data:
 *   - Name (auto name the next number higher?)
 *   - VNIC Profile (which includes the network) <-- needs to be on same DC and the VM
 *
 * Optional data:
 *   - Network Type (dual mode virtio and rtl8139, virtio, rtl8139, e1000, e1000e)
 *     - NOTE: can only be changed if VM is down or Nic (card) is unplugged
 *   - Link State (Up = connected, Down = cable unplugged)
 */
class NicEditor extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showModal: false,

      id: undefined,
      values: {
        name: props.nextNicName,
        vnicProfileId: EMPTY_VNIC_PROFILE_ID,
        interface: NIC_INTERFACE_DEFAULT,
        linked: true,
      },
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
        values: {
          name: nic.name,
          vnicProfileId: nic.vnicProfile.id,
          interface: nic.interface,
          linked: nic.linked,
        },
      })
    } else {
      this.setState({
        showModal: true,

        id: undefined,
        values: {
          name: this.props.nextNicName,
          vnicProfileId: EMPTY_VNIC_PROFILE_ID,
          interface: NIC_INTERFACE_DEFAULT,
          linked: true,
        },
      })
    }
  }

  close () {
    this.setState({ showModal: false })
  }

  composeNic () {
    const nic = {
      id: this.state.id,
      name: this.state.values.name,
      vnicProfile: {
        id: this.state.values.vnicProfileId,
      },
      interface: this.state.values.interface,
      linked: this.state.values.linked,
    }

    return nic
  }

  changeName (value) {
    this.setState((state) => ({ values: { ...state.values, name: value } }))
  }

  changeVnicProfile (value) {
    this.setState((state) => ({ values: { ...state.values, vnicProfileId: value } }))
  }

  changeInterface (value) {
    this.setState((state) => ({ values: { ...state.values, interface: value } }))
  }

  changeLinked (value) {
    this.setState((state) => ({ values: { ...state.values, linked: !!value } }))
  }

  handleSave () {
    const newNic = this.composeNic()
    this.props.onSave(newNic)
    this.close()
  }

  render () {
    const {
      idPrefix,
      trigger,
      vmStatus,
      vnicProfileList,
      msg,
      locale,
    } = this.props
    const NIC_INTERFACES = createNicInterfacesList(msg)
    const modalId = idPrefix + '-modal'

    const createMode = !this.props.nic

    const vnicList = createVNicProfileList(vnicProfileList, { locale, msg })
    const nicInterface = NIC_INTERFACES.find(ni => ni.id === this.state.values.interface)
    const canChangeInterface =
      createMode ||
      (
        !NIC_INTERFACE_CANT_CHANGE.includes(this.props.nic.interface) &&
        (vmStatus === 'down' || !this.props.nic.plugged)
      )

    return (
      <>
        { trigger({ onClick: this.open }) }

        <Modal
          id={modalId}
          isOpen={this.state.showModal}
          onClose={this.close}
          title={createMode ? msg.addNewNic() : msg.editNic()}
          variant={ModalVariant.small}
          position='top'
          actions={[
            <Button
              id={`${modalId}-button-ok`}
              key='ok'
              variant='primary'
              onClick={this.handleSave}
              disabled={this.state.values.name === ''}
            >
              { msg.ok() }
            </Button>,
            <Button
              id={`${modalId}-button-cancel`}
              key='cancel'
              variant='link'
              onClick={this.close}
            >
              { msg.cancel() }
            </Button>,

          ]}
        >
          <Form
            isHorizontal
            id={`${modalId}-form`}
          >
            <FormGroup label={ msg.nicEditorNameLabel() } fieldId={`${modalId}-name`} >
              <TextInput
                id={`${modalId}-name`}
                type='text'
                value={this.state.values.name}
                onChange={this.changeName}
              />
            </FormGroup>

            <FormGroup fieldId={`${modalId}-vnic-profile`} label={ msg.vnicProfile() }>
              <FormSelect
                id={`${modalId}-vnic-profile`}
                value={this.state.values.vnicProfileId}
                onChange={this.changeVnicProfile}
              >
                {vnicList.map((option, index) => (
                  <FormSelectOption key={index} value={option.id} label={option.value} />
                ))}
              </FormSelect>
            </FormGroup>

            <FormFieldGroupExpandable
              header={ <FormFieldGroupHeader titleText={{ text: msg.advancedOptions(), id: 'nic-edit-advanced-options' }} />}
            >
              <FormGroup
                label={ msg.nicEditorInterfaceLabel() }
                labelIcon={!canChangeInterface && (
                  <InfoTooltip
                    id={`${modalId}-interface-edit-tooltip`}
                    tooltip={msg.nicEditorInterfaceCantEditHelp()}
                  />
                )}
                fieldId={`${modalId}-interface`}
              >
                { !canChangeInterface && (
                  <div className={style['editor-value-text']} id={`${modalId}-interface`}>
                    { nicInterface ? nicInterface.value : 'N/A' }
                  </div>
                )}
                { canChangeInterface && (
                  <FormSelect
                    id={`${modalId}-interface`}
                    value={this.state.values.interface}
                    onChange={this.changeInterface}
                  >
                    {NIC_INTERFACES.map((option, index) => (
                      <FormSelectOption key={index} value={option.id} label={option.value} />
                    ))}
                  </FormSelect>

                )}
              </FormGroup>
              <FormGroup fieldId='nic-link-state-group' label={ msg.nicEditorLinkStateLabel() }>
                <Radio
                  id={`${modalId}-link-state-on`}
                  name='nic-link-state-group'
                  isChecked={this.state.values.linked}
                  onChange={() => { this.changeLinked(true) }}
                  label={ (
                    <>
                      {msg.nicEditorLinkStateUp()}
                      <NicLinkStateIcon linkState idSuffix='up' showTooltip={false} />
                    </>
                  ) }
                />
                <Radio
                  id={`${modalId}-link-state-off`}
                  name='nic-link-state-group'
                  isChecked={!this.state.values.linked}
                  onChange={() => { this.changeLinked(false) }}
                  label={ (
                    <>
                      { msg.nicEditorLinkStateDown() }
                      <NicLinkStateIcon idSuffix='down' showTooltip={false} />
                    </>
                  ) }
                />
              </FormGroup>
            </FormFieldGroupExpandable>
          </Form>
        </Modal>
      </>
    )
  }
}

NicEditor.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  nic: PropTypes.object,
  vmStatus: PropTypes.string,
  nextNicName: PropTypes.string,

  vnicProfileList: PropTypes.object.isRequired,
  trigger: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default withMsg(NicEditor)
