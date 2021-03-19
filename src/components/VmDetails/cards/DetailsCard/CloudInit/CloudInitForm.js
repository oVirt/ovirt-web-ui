import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  FormControl,
  ControlLabel,
  FormGroup,
} from 'patternfly-react'
import { MsgContext } from '_/intl'

const CloudInitForm = ({ idPrefix, vm, onChange }) => {
  const { msg } = useContext(MsgContext)
  const cloudInitHostName = vm.getIn(['cloudInit', 'hostName'])
  const cloudInitSshAuthorizedKeys = vm.getIn(['cloudInit', 'sshAuthorizedKeys'])
  return (
    <React.Fragment>
      <FormGroup controlId={`${idPrefix}-cloud-init-hostname`}>
        <ControlLabel>
          {msg.hostName()}
        </ControlLabel>
        <FormControl
          type='text'
          value={cloudInitHostName}
          onChange={e => onChange('cloudInitHostName', e.target.value)}
        />
      </FormGroup>
      <FormGroup controlId={`${idPrefix}-cloud-init-ssh`}>
        <ControlLabel>
          {msg.sshAuthorizedKeys()}
        </ControlLabel>
        <FormControl
          componentClass='textarea'
          value={cloudInitSshAuthorizedKeys}
          onChange={e => onChange('cloudInitSshAuthorizedKeys', e.target.value)}
        />
      </FormGroup>
    </React.Fragment>
  )
}

CloudInitForm.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default CloudInitForm
