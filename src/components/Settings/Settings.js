import React, { useState, useEffect, useContext } from 'react'
import PropTypes from 'prop-types'

import SettingsToolbar from './SettingsToolbar'
import NavigationPrompt from 'react-router-navigation-prompt'
import NavigationConfirmationModal from '../NavigationConfirmationModal'
import CounterAlert from '_/components/CounterAlert'
import { generateUnique } from '_/helpers'
import { MsgContext } from '_/intl'
import style from './style.css'
import ChangesList from './ChangesList'

const changedInTheMeantime = ({ currentValues = {}, baseValues = {}, draftValues = {}, sentValues = {} }) => {
  return Object.keys(currentValues).filter(name =>
    currentValues[name] !== baseValues[name] && !(
      // draft is the same as 3rd party change - no risk of losing data
      currentValues[name] === draftValues[name] ||
      // it's your own update but user modified draft in the meantime
      currentValues[name] === sentValues[name]))
}

const pendingUserChanges = ({ currentValues = {}, draftValues = {} }) => {
  return Object.keys(currentValues).filter(name =>
    currentValues[name] !== draftValues[name] &&
    draftValues[name] !== undefined
  )
}

const changedInLastTransaction = ({ currentValues = {}, sentValues = {} }) => {
  return Object.keys(currentValues).filter(name =>
    currentValues[name] === sentValues[name] && currentValues[name] !== undefined)
}

const stillPending = ({ currentValues = {}, sentValues = {} }) => {
  return Object.keys(currentValues).filter(name =>
    sentValues[name] !== undefined &&
      currentValues[name] !== sentValues[name])
}

const enableResetToDefaultSetting = ({ defaultValues = {}, currentValues = {} }) => {
  return !!Object.keys(defaultValues).find(key => defaultValues[key] !== currentValues[key])
}

const Settings = ({ draftValues, onSave, lastTransactionId, onCancel,
  translatedLabels, baseValues, sentValues, currentValues,
  resetBaseValues, children, onReset, defaultValues }) => {
  const { msg } = useContext(MsgContext)
  const [transactionId, setTransactionId] = useState(null)

  const handleSave = () => {
    const saveFields = pendingUserChanges({ currentValues, draftValues }).reduce((acc, cur) => ({ ...acc, [cur]: draftValues[cur] }), {})
    const id = generateUnique('Settings-save_')
    setTransactionId(id)
    onSave(saveFields, id)
  }

  const conflictingChanges = changedInTheMeantime({ currentValues, baseValues, draftValues, sentValues }).map(field => translatedLabels[field])
  const pendingChanges = pendingUserChanges({ currentValues, draftValues })
  const stillPendingAfterSave = stillPending({ currentValues, sentValues })
  const changedInLastTrans = changedInLastTransaction({ currentValues, sentValues })
  const enableReset = !pendingChanges.length && enableResetToDefaultSetting({ currentValues, defaultValues })

  if (conflictingChanges.length) {
    console.warn(`Store content changed while editing settings for fields: ${JSON.stringify(conflictingChanges)}`)
  }

  const handleReset = () => {
    const aggregatedValues = { ...currentValues, ...defaultValues }
    const saveFields = pendingUserChanges({ currentValues, draftValues: aggregatedValues }).reduce((acc, cur) => ({ ...acc, [cur]: aggregatedValues[cur] }), {})
    const id = generateUnique('Settings-save_')
    setTransactionId(id)
    setIsReset(true) // disabling the save button on reset
    onReset(saveFields, id)
  }
  const fullSuccess = changedInLastTrans.length !== 0 &&
   stillPendingAfterSave.length === 0 &&
   transactionId === lastTransactionId
  const completeFailure = changedInLastTrans.length === 0 &&
   stillPendingAfterSave.length !== 0 &&
   transactionId === lastTransactionId
  const partialSuccess = changedInLastTrans.length !== 0 &&
   stillPendingAfterSave.length !== 0 &&
   transactionId === lastTransactionId

  const [showFullSuccess, setShowFullSuccess] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [showCompleteFailure, setShowCompleteFailure] = useState(false)
  const [partialSave, setShowPartialSave] = useState({ show: false, fields: [] })

  const resetNotifications = (setter, parameters = false) => {
    setter(parameters)
    isReset && setIsReset(false)
  }

  useEffect(() => {
    const partialSaveState = {
      show: partialSuccess,
      fields: pendingChanges,
    }
    if (partialSaveState.show) { setShowPartialSave(partialSaveState) }
    if (completeFailure) { setShowCompleteFailure(completeFailure) }
    if (fullSuccess) { setShowFullSuccess(fullSuccess) }
    if (fullSuccess || completeFailure || partialSuccess) {
      // the transaction has finished - remove tracking id
      setTransactionId(null)
      // reset to new base level that contains last modifications
      resetBaseValues()
    }
  }, [partialSuccess, completeFailure, fullSuccess, pendingChanges])

  return <React.Fragment>
    <NavigationPrompt when={(currentLocation, nextLocation) => !!pendingChanges.length}>
      {({ isActive, onConfirm, onCancel }) => (
        <NavigationConfirmationModal show={isActive} onYes={onConfirm} onNo={onCancel} />
      )}
    </NavigationPrompt>
    <div className={showFullSuccess || partialSave.show || showCompleteFailure ? style['alert-container'] : null}>
      { showFullSuccess &&
        <CounterAlert
          timeout={10}
          title={isReset ? msg.changesResetSuccessfully() : msg.changesSavedSuccesfully()}
          type='success'
          onDismiss={() => resetNotifications(setShowFullSuccess, false)}
        />
      }
      { partialSave.show &&
        <CounterAlert
          timeout={10}
          type='error'
          title={<p>{msg.failedToSaveChangesToFields()}</p>}
          onDismiss={() => resetNotifications(setShowPartialSave, { show: false, fields: [] })} >
          <ChangesList changes={partialSave.fields} translatedLabels={translatedLabels} />
        </CounterAlert>
      }
      { showCompleteFailure &&
        <CounterAlert
          timeout={10}
          type='error'
          title={msg.failedToSaveChanges()}
          onDismiss={() => resetNotifications(setShowCompleteFailure, false)}
        />
      }
    </div>
    <SettingsToolbar
      onSave={handleSave}
      onReset={handleReset}
      enableReset={enableReset}
      onCancel={onCancel}
      enableSave={!!pendingChanges.length && !isReset}
      changes={pendingChanges}
      translatedLabels={translatedLabels}
    />
    {children}
  </React.Fragment>
}
Settings.propTypes = {
  draftValues: PropTypes.object.isRequired,
  currentValues: PropTypes.object.isRequired,
  baseValues: PropTypes.object.isRequired,
  sentValues: PropTypes.object.isRequired,
  translatedLabels: PropTypes.array.isRequired,
  lastTransactionId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  children: PropTypes.node,
  resetBaseValues: PropTypes.func.isRequired,
  defaultValues: PropTypes.object,
}

export default Settings
