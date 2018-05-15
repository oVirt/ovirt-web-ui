import React from 'react'
import PropTypes from 'prop-types'

import style from './style.css'

class Checkbox extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      checked: !!props.checked,
    }

    this.onChange = this.onChange.bind(this)
  }

  onChange (event) {
    console.log('onChange called')
    this.setState({ checked: !this.state.checked })
    this.props.onClick(event.target.checked)
  }

  render () {
    const { label, labelExtraStyle, order } = this.props

    return (
      <div className={style['checkbox']}>
        <label className={labelExtraStyle}>
          {label}
          <input type='checkbox' onChange={this.onChange} checked={this.state.checked} />
          <span className={`${style['cr']} ${order === 'reversed' ? style['right'] : style['left']}`}>
            <i className={`${style['cr-icon']} fa fa-check`} />
          </span>
        </label>
      </div>
    )
  }
}

Checkbox.propTypes = {
  checked: PropTypes.bool,
  label: PropTypes.string.isRequired,
  labelExtraStyle: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  order: PropTypes.string,
}

export default Checkbox
