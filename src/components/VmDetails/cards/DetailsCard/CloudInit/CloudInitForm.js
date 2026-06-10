import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Checkbox,
  FormGroup,
  TextArea,
  TextInput,
} from '@patternfly/react-core'
import { MsgContext } from '_/intl'

const CloudInitForm = ({ idPrefix, vm, onChange }) => {
  const { msg } = useContext(MsgContext)
  const cloudInitHostName = vm.getIn(['cloudInit', 'hostName'])
  const cloudInitSshAuthorizedKeys = vm.getIn(['cloudInit', 'sshAuthorizedKeys'])
  const cloudInitUsername = vm.getIn(['cloudInit', 'username'])
  const cloudInitPassword = vm.getIn(['cloudInit', 'password']) || ''
  const [useConfiguredPassword, setUseConfiguredPassword] = useState(!!cloudInitPassword)
  return (
    <>
      <FormGroup
        label={msg.hostName()}
        fieldId={`${idPrefix}-cloud-init-hostname`}
      >
        <TextInput
          id={`${idPrefix}-cloud-init-hostname`}
          type="text"
          value={cloudInitHostName}
          onChange={value => onChange('cloudInitHostName', value)}
        />
      </FormGroup>
      <FormGroup
        label={msg.sshAuthorizedKeys()}
        fieldId={`${idPrefix}-cloud-init-ssh`}
      >
        <TextArea
          id={`${idPrefix}-cloud-init-ssh`}
          value={cloudInitSshAuthorizedKeys}
          onChange={value => onChange('cloudInitSshAuthorizedKeys', value)}
        />
      </FormGroup>
      <FormGroup
        label={msg.username()}
        fieldId={`${idPrefix}-cloud-init-username`}
      >
        <TextInput
          id={`${idPrefix}-cloud-init-username`}
          value={cloudInitUsername}
          onChange={value => onChange('cloudInitUsername', value)}
        />
      </FormGroup>
      <Checkbox
        id={`${idPrefix}-cloud-init-password-configured`}
        label={msg.useConfiguredPassword()}
        isChecked={useConfiguredPassword}
        onChange={(checked) => {
          setUseConfiguredPassword(checked)
          if (!checked) {
            onChange('cloudInitPassword', '')
          }
        }}
      />
      <FormGroup
        label={msg.password()}
        fieldId={`${idPrefix}-cloud-init-password`}
      >
        <TextInput
          id={`${idPrefix}-cloud-init-password`}
          type="password"
          value={cloudInitPassword}
          isDisabled={useConfiguredPassword}
          onChange={value => onChange('cloudInitPassword', value)}
        />
      </FormGroup>
    </>
  )
}

CloudInitForm.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default CloudInitForm
