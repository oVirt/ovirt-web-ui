import React from 'react'
import PropTypes from 'prop-types'
import {
  FormControl,
  ControlLabel,
  FormGroup,
} from 'patternfly-react'
import { msg } from '_/intl'
import SelectBox from '../../../../SelectBox'
import timezones from './timezones.json'

const SysprepForm = ({ idPrefix, vm, onChange }) => {
  const cloudInitHostName = vm.getIn(['cloudInit', 'hostName'])
  const cloudInitPassword = vm.getIn(['cloudInit', 'password'])
  const cloudInitTimezone = vm.getIn(['cloudInit', 'timezone']) || timezones[0].id
  const cloudInitCustomScript = vm.getIn(['cloudInit', 'customScript'])
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
      <FormGroup controlId={`${idPrefix}-cloud-init-hostname`}>
        <ControlLabel>
          {msg.password()}
        </ControlLabel>
        <FormControl
          type='password'
          value={cloudInitPassword}
          onChange={e => onChange('cloudInitPassword', e.target.value)}
        />
      </FormGroup>
      <FormGroup controlId={`${idPrefix}-cloud-init-timezone`}>
        <ControlLabel>
          {msg.timezone()}
        </ControlLabel>
        <SelectBox
          id={`${idPrefix}-sysprep-timezone-select`}
          items={timezones}
          selected={cloudInitTimezone}
          onChange={(selectedId) => onChange('cloudInitTimezone', selectedId)}
        />
      </FormGroup>
      <FormGroup controlId={`${idPrefix}-sysprep-custom-script`}>
        <ControlLabel>
          {msg.customScript()}
        </ControlLabel>
        <FormControl
          componentClass='textarea'
          value={cloudInitCustomScript}
          onChange={e => onChange('cloudInitCustomScript', e.target.value)}
        />
      </FormGroup>
    </React.Fragment>
  )
}

SysprepForm.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default SysprepForm
