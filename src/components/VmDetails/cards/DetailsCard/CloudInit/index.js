import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Switch } from '@patternfly/react-core'
import { MsgContext } from '_/intl'
import FieldRow from '../FieldRow'
import CloudInitForm from './CloudInitForm'
import SysprepForm from './SysprepForm'

const CloudInit = ({ idPrefix, vm, isWindows, onChange, lastInitTimezone }) => {
  const { msg } = useContext(MsgContext)
  const cloudInitEnabled = vm.getIn(['cloudInit', 'enabled'])
  const label = isWindows ? msg.sysprep() : msg.cloudInit()
  return (
    <>
      <FieldRow label={label} id={`${idPrefix}-cloud-init`}>
        <Switch
          id={`${idPrefix}-cloud-init-edit`}
          aria-label={label}
          isChecked={cloudInitEnabled}
          onChange={state => onChange('cloudInitEnabled', state)}
        />
      </FieldRow>
      { cloudInitEnabled && (
        <div style={{ marginTop: '15px' }}>
          {
          isWindows
            ? <SysprepForm idPrefix={idPrefix} vm={vm} onChange={onChange} lastInitTimezone={lastInitTimezone} />
            : <CloudInitForm idPrefix={idPrefix} vm={vm} onChange={onChange} />
        }
        </div>
      ) }
    </>
  )
}

CloudInit.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  isWindows: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  lastInitTimezone: PropTypes.string.isRequired,
}

export default CloudInit
