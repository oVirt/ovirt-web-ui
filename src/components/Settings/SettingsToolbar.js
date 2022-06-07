import React, { useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { MsgContext } from '_/intl'

import style from './style.css'
import ConfirmationModal from '_/components/VmActions/ConfirmationModal'
import ChangesList from './ChangesList'

const SettingsToolbar = ({ onSave, onReset, onCancel, enableSave, enableReset, translatedLabels, changes = [] }) => {
  const { msg } = useContext(MsgContext)
  const [container] = useState(document.createElement('div'))
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)

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

  return ReactDOM.createPortal(
    <>
      <ConfirmationModal
        show={showSaveConfirmModal}
        title={msg.saveChanges()}
        body={msg.saveSettingsChangesConfirmation()}
        subContent={<ChangesList changes={changes} translatedLabels={translatedLabels} />}
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
      <Toolbar isFullHeight isSticky alignment={{ default: 'alignLeft' }} className={style['settings-toolbar']}>
        <ToolbarContent>
          <ToolbarGroup variant='button-group' alignment={{ default: 'alignLeft' }}>
            <ToolbarItem>
              <Button isDisabled={!enableReset} onClick={() => setShowResetConfirmModal(true) } >
                {msg.resetSettings()}
              </Button>
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup variant='button-group' alignment={ { default: 'alignRight' } } >
            <ToolbarItem>
              <Button onClick={ onCancel } variant='link' >
                {msg.cancel()}
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button isDisabled={!enableSave} onClick={() => setShowSaveConfirmModal(true)} >
                {msg.save()}
              </Button>
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>

    </>
    ,
    container
  )
}

SettingsToolbar.propTypes = {
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  translatedLabels: PropTypes.array.isRequired,
  enableSave: PropTypes.bool,
  changes: PropTypes.array,
}

export default SettingsToolbar
