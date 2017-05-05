import React from 'react'
import PropTypes from 'prop-types'

import style from './sharedStyle.css'

const LabeledTextField = ({
  id,
  label,
  onChange,
  placeholder = label,
  value,
  type = 'text',
  disabled = false,
  step = 1,
  min = 0,
  fieldHelp,
  }) => (
    <div className='form-group'>
      <label className={`col-sm-3 control-label ${style['labeled-field']}`} >
        {label}&nbsp;{fieldHelp}
      </label>
      <div className='col-sm-9'>
        <input
          type={type}
          className='form-control'
          id={id}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          min={min}
          step={step}
          disabled={disabled} />
      </div>
    </div>
)

LabeledTextField.propTypes = {
  onChange: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  step: PropTypes.number,
  min: PropTypes.number,
  disabled: PropTypes.bool,
  fieldHelp: PropTypes.object,
}

export default LabeledTextField
