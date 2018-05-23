import React from 'react'
import PropTypes from 'prop-types'

import style from './sharedStyle.css'

const NOBREAK_SPACE = '\u00A0'

function getSelectedId (props) {
  return props.selected || (Object.values(props.items)[0] && Object.values(props.items)[0].id)
}

class SelectBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = { selected: getSelectedId(props), changed: false }
    this.handleChange = this.handleChange.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    if (!this.state.changed) {
      this.setState({ selected: getSelectedId(nextProps) })
    }
  }

  handleChange (id) {
    return () => {
      this.setState({ selected: id, changed: true })
      this.props.onChange(id)
    }
  }

  render () {
    let { items, idPrefix } = this.props

    const selectedItem = items[this.state.selected] || Object.values(items)[0]

    let idCounter = 0
    return (
      <div style={{ width: '100%' }}>
        <div className='dropdown'>
          <button className={`btn btn-default dropdown-toggle ${style['dropdown-button']}`} type='button' data-toggle='dropdown' id={`${idPrefix}-button-toggle`}>
            <span className={style['dropdown-button-text']} id={`${idPrefix}-button-text`}>
              {selectedItem ? selectedItem.value : NOBREAK_SPACE}
            </span>
            <span className='caret' id={`${idPrefix}-button-caret`} />
          </button>
          <ul className={`dropdown-menu ${style['dropdown']}`} role='menu'>
            {Object.values(items).map(item => (
              <li role='presentation' className={item.id === this.state.selected ? 'selected' : ''} key={item.id}>
                <a role='menuitem' tabIndex='-1' onClick={this.handleChange(item.id)} id={`${idPrefix}-${idCounter++}`}>
                  {item.value}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>)
  }
}

SelectBox.propTypes = {
  selected: PropTypes.string, // false-ish for the first item
  items: PropTypes.object.isRequired, // {[string]: { id: string, value: string} } ; yes, the id is there twice
  onChange: PropTypes.func.isRequired, // (selectedId: string) => any
  idPrefix: PropTypes.string.isRequired,
}

export default SelectBox
