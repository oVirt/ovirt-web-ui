import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { Toolbar } from 'patternfly-react'
import { msg } from '_/intl'

import style from './style.css'
import ConfirmationModal from '_/components/VmActions/ConfirmationModal'

const SettingsToolbar = ({ onSave, onCancel, enableSave, translatedLabels, changes = [] }) => {
  const [container] = useState(document.createElement('div'))
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const idPrefix = 'settings_toolbar'

  useEffect(() => {
    const root = document.getElementById('settings-toolbar')
    if (root) {
      root.appendChild(container)
    }
    return () => root && root.removeChild(container)
  })

  const onConfirm = () => {
    onClose()
    onSave()
  }

  const onClose = () => {
    setShowConfirmModal(false)
  }

  const buildConfirmationModalSubContent = () => (
    <ul className={style['changes-list']}>{
      changes.map(name => {
        const value = translatedLabels[name] || name
        return (<li key={`${idPrefix}_li_${value}`}>{value}</li>)
      })
    }
    </ul>
  )

  return ReactDOM.createPortal(
    <Toolbar className={style['toolbar']}>
      <ConfirmationModal
        show={showConfirmModal}
        title={msg.saveChanges()}
        body={msg.saveSettingsChangesConfirmation()}
        subContent={buildConfirmationModalSubContent()}
        onClose={onClose}
        confirm={{
          title: msg.yes(),
          onClick: onConfirm,
        }}
      />
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
            setShowConfirmModal(true)
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
  translatedLabels: PropTypes.object.isRequired,
  enableSave: PropTypes.bool,
  changes: PropTypes.array,
}

export default SettingsToolbar
