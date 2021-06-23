import React from 'react'
import PropTypes from 'prop-types'

import { Button, ButtonToolbar } from 'react-bootstrap'

import style from './style.css'

const Confirmation = ({ okButton, cancelButton, extraButton, text, height, uniqueId }) => {
  const idPrefix = `confirmation-${uniqueId || ''}`

  const s = {}
  if (height) {
    s.height = height
  }

  return (
    <span className={style['confirmation-body']} style={s} id={`${idPrefix}-body`}>
      {typeof text === 'string'
        ? (<p className={style['confirmation-text']}>{text}</p>)
        : (<div className={style['confirmation-text']}>{text}</div>) }

      <ButtonToolbar className={style['confirmation-toolbar']}>
        <Button id={`${idPrefix}-button-ok`} bsSize='xsmall' bsStyle='info' className={`${style['confirmation-ok-button']}`} onClick={okButton.click}>
          {okButton.label}
        </Button>
        <Button id={`${idPrefix}-button-cancel`} bsSize='xsmall' onClick={cancelButton.click}>
          {cancelButton.label}
        </Button>
        {extraButton && (
          <Button id={`${idPrefix}-button-extra1`} bsSize='xsmall' bsStyle='info' className={`${style['confirmation-extra-button']}`} onClick={extraButton.click}>
            {extraButton.label}
          </Button>
        )}
      </ButtonToolbar>
    </span>
  )
}

Confirmation.propTypes = {
  okButton: PropTypes.object.isRequired,
  cancelButton: PropTypes.object.isRequired,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  height: PropTypes.number,
  extraButton: PropTypes.object,
  uniqueId: PropTypes.string,
}

export default Confirmation
