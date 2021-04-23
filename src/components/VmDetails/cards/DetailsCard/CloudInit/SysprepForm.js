import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  Checkbox,
  ControlLabel,
  FormControl,
  FormGroup,
} from 'patternfly-react'
import { MsgContext } from '_/intl'
import SelectBox from '../../../../SelectBox'
import timezones from '_/components/utils/timezones.json'

const SysprepForm = ({ idPrefix, vm, onChange, lastInitTimezone }) => {
  const { msg } = useContext(MsgContext)
  const cloudInitHostName = vm.getIn(['cloudInit', 'hostName'])
  const cloudInitPassword = vm.getIn(['cloudInit', 'password'])
  const cloudInitCustomScript = vm.getIn(['cloudInit', 'customScript'])
  const enableInitTimezone = !!vm.getIn(['cloudInit', 'timezone']) // true if sysprep timezone set or Configure Timezone checked

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

      {/*  Configure Timezone checkbox */}
      <Checkbox
        id={`${idPrefix}-sysprep-timezone-config`}
        checked={enableInitTimezone}
        onChange={e => onChange('enableInitTimezone', e.target.checked)}
      >
        {msg.sysPrepTimezoneConfigure()}
      </Checkbox>

      <FormGroup controlId={`${idPrefix}-cloud-init-timezone`}>
        <ControlLabel>
          {msg.timezone()}
        </ControlLabel>
        <SelectBox
          id={`${idPrefix}-sysprep-timezone-select`}
          items={timezones}
          selected={lastInitTimezone}
          onChange={(selectedId) => onChange('cloudInitTimezone', selectedId)}
          disabled={!enableInitTimezone}
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
  lastInitTimezone: PropTypes.string.isRequired,
}

export default SysprepForm
