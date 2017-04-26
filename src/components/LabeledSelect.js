import React, { PropTypes } from 'react'

import style from './sharedStyle.css'

const LabeledSelect = ({
  selectClass = 'selectpicker',
  data,
  value,
  onChange,
  label,
  renderer = (item) => item.get('name'),
  fieldHelp,
}) => (
  <div className='form-group'>
    <label className={`col-sm-2 control-label ${style['labeled-field']}`}>
      {label}
      &nbsp;{fieldHelp}
    </label>
    <div className='col-sm-10'>
      <select
        className={selectClass}
        onChange={onChange}
        value={value} >
        {data.toList().map(item => (
          <option value={item.get('id')} key={item.get('id')}>
            {renderer(item)}
          </option>
        ))}
      </select>
    </div>
  </div>
)

LabeledSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  renderer: PropTypes.func,
  selectClass: PropTypes.string,
  fieldHelp: PropTypes.object,
}

export default LabeledSelect
