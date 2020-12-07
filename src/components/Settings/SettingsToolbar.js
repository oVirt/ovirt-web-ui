import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { Toolbar } from 'patternfly-react'
import { msg } from '_/intl'

import style from './style.css'

const SettingsToolbar = ({ onSave, onCancel, enableSave }) => {
  const [container] = useState(document.createElement('div'))
  useEffect(() => {
    const root = document.getElementById('settings-toolbar')
    if (root) {
      root.appendChild(container)
    }
    return () => root && root.removeChild(container)
  })

  return ReactDOM.createPortal(
    <Toolbar className={style['toolbar']}>
      <Toolbar.RightContent>
        <button
          onClick={e => {
            e.preventDefault()
            onCancel()
          }}
          className='btn btn-default'
        >
          {msg.cancel()}
        </button>
        <button
          disabled={!enableSave}
          onClick={e => {
            e.preventDefault()
            onSave()
          }}
          className='btn btn-primary'
        >
          {msg.save()}
        </button>
      </Toolbar.RightContent>
    </Toolbar>,
    container
  )
}

SettingsToolbar.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  enableSave: PropTypes.bool,
}

export default SettingsToolbar
