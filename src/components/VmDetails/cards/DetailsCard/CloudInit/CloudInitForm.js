import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  FormGroup,
  TextArea,
  TextInput,
} from '@patternfly/react-core'
import { MsgContext } from '_/intl'

const CloudInitForm = ({ idPrefix, vm, onChange }) => {
  const { msg } = useContext(MsgContext)
  const cloudInitHostName = vm.getIn(['cloudInit', 'hostName'])
  const cloudInitSshAuthorizedKeys = vm.getIn(['cloudInit', 'sshAuthorizedKeys'])
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
    </>
  )
}

CloudInitForm.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default CloudInitForm
