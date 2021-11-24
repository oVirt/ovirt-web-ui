import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  Checkbox,
  FormGroup,
  TextArea,
  TextInput,
} from '@patternfly/react-core'
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
    <>
      <FormGroup
        label={msg.hostName()}
        fieldId={`${idPrefix}-sysprep-hostname`}
      >
        <TextInput
          id={`${idPrefix}-sysprep-hostname`}
          type='text'
          value={cloudInitHostName}
          onChange={value => onChange('cloudInitHostName', value)}
        />
      </FormGroup>
      <FormGroup
        label={msg.password()}
        fieldId={`${idPrefix}-sysprep-password`}
      >
        <TextInput
          id={`${idPrefix}-sysprep-password`}
          type='password'
          value={cloudInitPassword}
          onChange={value => onChange('cloudInitPassword', value)}
        />
      </FormGroup>

      {/*  Configure Timezone checkbox */}
      <Checkbox
        id={`${idPrefix}-sysprep-timezone-config`}
        label={msg.sysPrepTimezoneConfigure()}
        isChecked={enableInitTimezone}
        onChange={checked => onChange('enableInitTimezone', checked)}
      />

      <FormGroup
        label={msg.timezone()}
        fieldId={`${idPrefix}-sysprep-timezone-select`}
      >
        <SelectBox
          id={`${idPrefix}-sysprep-timezone-select`}
          items={timezones}
          selected={lastInitTimezone}
          onChange={(selectedId) => onChange('cloudInitTimezone', selectedId)}
          disabled={!enableInitTimezone}
        />
      </FormGroup>
      <FormGroup
        label={msg.customScript()}
        fieldId={`${idPrefix}-sysprep-custom-script`}
      >
        <TextArea
          id={`${idPrefix}-sysprep-custom-script`}
          value={cloudInitCustomScript}
          onChange={value => onChange('cloudInitCustomScript', value)}
        />
      </FormGroup>
    </>
  )
}

SysprepForm.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  lastInitTimezone: PropTypes.string.isRequired,
}

export default SysprepForm
