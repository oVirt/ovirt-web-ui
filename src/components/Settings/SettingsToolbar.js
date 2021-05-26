import React, { useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { Toolbar } from 'patternfly-react'
import { MsgContext } from '_/intl'

import style from './style.css'
import ConfirmationModal from '_/components/VmActions/ConfirmationModal'

const SettingsToolbar = ({ onSave, onReset, onCancel, enableSave, enableReset, translatedLabels, changes = [] }) => {
  const { msg } = useContext(MsgContext)
  const [container] = useState(document.createElement('div'))
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const idPrefix = 'settings_toolbar'

  useEffect(() => {
    const root = document.getElementById('settings-toolbar')
    if (root) {
      root.appendChild(container)
    }
    return () => root && root.removeChild(container)
  })
  const onResetConfirm = () => {
    onResetClose()
    onReset()
  }

  const onSaveConfirm = () => {
    onSaveClose()
    onSave()
  }

  const onSaveClose = () => {
    setShowSaveConfirmModal(false)
  }

  const onResetClose = () => {
    setShowResetConfirmModal(false)
  }

  const buildConfirmationModalSubContent = () => (
    <ul className={style['changes-list']}>{
      changes.map(name => {
        const value = translatedLabels[name] || name
        return (<li key={`${idPrefix}_li_${name}`}>{value}</li>)
      })
    }
    </ul>
  )

  return ReactDOM.createPortal(
    <Toolbar className={style['toolbar']}>
      <ConfirmationModal
        show={showSaveConfirmModal}
        title={msg.saveChanges()}
        body={msg.saveSettingsChangesConfirmation()}
        subContent={buildConfirmationModalSubContent()}
        onClose={onSaveClose}
        confirm={{
          title: msg.yes(),
          onClick: onSaveConfirm,
        }}
      />
      <ConfirmationModal
        show={showResetConfirmModal}
        title={msg.resetSettings()}
        body={msg.resetSettingsQuestion()}
        subContent={msg.resetSettingsWarning()}
        onClose={onResetClose}
        confirm={{
          title: msg.reset(),
          onClick: onResetConfirm,
        }}
      />
      <button
        className='btn btn-default'
        disabled={!enableReset}
        onClick={(e) => {
          e.preventDefault()
          setShowResetConfirmModal(true)
        }}
      >
        {msg.resetSettings()}
      </button>
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
            setShowSaveConfirmModal(true)
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
  onReset: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  translatedLabels: PropTypes.object.isRequired,
  enableSave: PropTypes.bool,
  changes: PropTypes.array,
}

export default SettingsToolbar
