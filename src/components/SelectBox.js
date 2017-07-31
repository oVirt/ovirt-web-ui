import React from 'react'
import PropTypes from 'prop-types'

import style from './sharedStyle.css'

class SelectBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = { selected: props.selected || Object.values(props.items)[0].id, changed: false }
    this.handleChange = this.handleChange.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (!this.state.changed) {
      this.setState({ selected: nextProps.selected || Object.values(nextProps.items)[0].id })
    }
  }

  handleChange (id) {
    return () => {
      this.setState({ selected: id, changed: true })
      this.props.onChange(id)
    }
  }
  render () {
    let { items } = this.props
    return (
      <div style={{ width: '100%' }}>
        <div className='dropdown'>
          <button className={`btn btn-default dropdown-toggle ${style['dropdown-button']}`} type='button' data-toggle='dropdown'>
            <span className={style['dropdown-button-text']}>{items[this.state.selected].value}</span>
            <span className='caret' />
          </button>
          <ul className={`dropdown-menu ${style['dropdown']}`} role='menu'>
            {Object.values(items).map(item => (
              <li role='presentation' className={item.id === this.state.selected ? 'selected' : ''} key={item.id}><a role='menuitem' tabIndex='-1' onClick={this.handleChange(item.id)}>{item.value}</a></li>
            ))}
          </ul>
        </div>
      </div>)
  }
}

SelectBox.propTypes = {
  selected: PropTypes.string.isRequired,
  items: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default SelectBox
