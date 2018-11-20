import React from 'react'
import PropTypes from 'prop-types'
import Switch from 'react-bootstrap-switch'

import { msg } from '_/intl'
import FieldHelp from '../FieldHelp/index'

import style from './style.css'

const passTargetValue = callback => event => callback(event.target.value)
const passSwitchValue = callback => (switchElement, value) => callback(value)

const CloudInitEditor = ({
  enabled,
  hostName,
  sshAuthorizedKeys,
  onEnabledChange,
  onHostNameChange,
  onSshAuthorizedKeysChange,
}) => {
  const membersEditor = (
    <div>
      <dt className={style.indented}>
        <FieldHelp content={msg.hostNameTooltip()} text={msg.hostName()} />
      </dt>
      <dd>
        <input
          type='text'
          className='form-control'
          id='cloudinit-hostname'
          placeholder={msg.hostName()}
          onChange={passTargetValue(onHostNameChange)}
          value={hostName || ''} />
      </dd>
      <dt className={style.indented}>
        <FieldHelp content={msg.sshAuthorizedKeysTooltip()} text={msg.sshAuthorizedKeys()} />
      </dt>
      <dd>
        <textarea
          value={sshAuthorizedKeys || ''}
          placeholder={msg.sshAuthorizedKeys()}
          onChange={passTargetValue(onSshAuthorizedKeysChange)}
          className='form-control'
        />
      </dd>
    </div>
  )

  return (
    <div>
      <dt>
        <FieldHelp content={msg.cloudInitTooltip()} text={msg.cloudInit()} />
      </dt>
      <dd>
        <Switch
          animate
          bsSize='mini'
          value={enabled}
          onChange={passSwitchValue(onEnabledChange)}
        />
      </dd>
      {enabled && membersEditor}
    </div>
  )
}

CloudInitEditor.propTypes = {
  enabled: PropTypes.bool.isRequired,
  hostName: PropTypes.string.isRequired,
  sshAuthorizedKeys: PropTypes.string.isRequired,
  onEnabledChange: PropTypes.func.isRequired, // (boolean) => any
  onHostNameChange: PropTypes.func.isRequired, // (string) => any
  onSshAuthorizedKeysChange: PropTypes.func.isRequired, // (string) => any
}

export default CloudInitEditor
