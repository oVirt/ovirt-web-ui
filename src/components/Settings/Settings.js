import React, { useState, useEffect, useContext } from 'react'
import PropTypes from 'prop-types'

import SettingsToolbar from './SettingsToolbar'
import NavigationPrompt from 'react-router-navigation-prompt'
import NavigationConfirmationModal from '../NavigationConfirmationModal'
import CounterAlert from '_/components/CounterAlert'
import { generateUnique } from '_/helpers'
import { MsgContext } from '_/intl'
import style from './style.css'

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

const Settings = ({ draftValues, onSave, lastTransactionId, onCancel,
  translatedLabels, baseValues, sentValues, currentValues,
  resetBaseValues, children }) => {
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

  if (conflictingChanges.length) {
    console.warn(`Store content changed while editing settings for fields: ${JSON.stringify(conflictingChanges)}`)
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
  const [showCompleteFailure, setShowCompleteFailure] = useState(false)
  const [partialSave, setShowPartialSave] = useState({ show: false, fields: [] })

  useEffect(() => {
    const partialSaveState = {
      show: partialSuccess,
      fields: pendingChanges.map(e => <p key={translatedLabels[e]}>{translatedLabels[e]}</p>),
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
          title={msg.changesSavedSuccesfully()}
          type='success'
          onDismiss={() => setShowFullSuccess(false)}
        />
      }
      { partialSave.show &&
        <CounterAlert
          timeout={10}
          type='error'
          title={<p>{msg.failedToSaveChangesToFields()}</p>}
          onDismiss={() => setShowPartialSave({ show: false, fields: [] })} >
          {partialSave.fields}
        </CounterAlert>
      }
      { showCompleteFailure &&
        <CounterAlert
          timeout={10}
          type='error'
          title={msg.failedToSaveChanges()}
          onDismiss={() => setShowCompleteFailure(false)}
        />
      }
    </div>
    <SettingsToolbar
      onSave={handleSave}
      onCancel={onCancel}
      enableSave={!!pendingChanges.length}
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
  translatedLabels: PropTypes.object.isRequired,
  lastTransactionId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  children: PropTypes.node,
  resetBaseValues: PropTypes.func.isRequired,
}

export default Settings
