import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

// use 'combobox form-control' class for patternfly combobox
const LabeledSelect = ({
  selectClass = 'selectpicker',
  data,
  value,
  getValue,
  onChange,
  label,
  renderer = (item) => item.get('name'),
}) => (
  <div className='form-group'>
    <label className='col-sm-2 control-label'>{label}</label>
    <div className='col-sm-10'>
      <select
        className={selectClass}
        ref={getValue}
        onChange={onChange}
        value={value} >
        {data.toList().map(item => (
          <option value={item.get('name')} key={item.get('id')}>{renderer(item)}</option>
        ))}
      </select>
    </div>
  </div>
)

LabeledSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  getValue: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  renderer: PropTypes.func,
  selectClass: PropTypes.string,
}

export default connect()(LabeledSelect)
