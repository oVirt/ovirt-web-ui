import React from 'react'
import PropTypes from 'prop-types'
import { sortedBy } from '../helpers'

import style from './sharedStyle.css'

const NOBREAK_SPACE = '\u00A0'

class SelectBox extends React.Component {

  static getSelectedId (props) {
    return props.selected == null ? (props.items.length > 0 ? props.items[0].id : null) : props.selected
  }

  static getItems (props) {
    return props.sort ? sortedBy(props.items, 'value') : props.items
  }

  constructor (props) {
    super(props)
    this.state = {
      selected: SelectBox.getSelectedId(props),
      items: SelectBox.getItems(props),
    }
    this.handleChange = this.handleChange.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    const nextState = { items: SelectBox.getItems(nextProps) }
    if (this.props.selected !== nextProps.selected) {
      nextState.selected = SelectBox.getSelectedId(nextProps)
    }
    this.setState(nextState)
  }

  handleChange (id) {
    return () => {
      this.setState({ selected: id })
      this.props.onChange(id)
    }
  }

  render () {
    let { idPrefix } = this.props

    const selectedItem = this.state.items.find(item => item.id === this.state.selected)

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
            {this.state.items.map(item => (
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
  selected: PropTypes.string,          // id of a selected item, false-ish for the first item
  items: PropTypes.array.isRequired,  // { id: string, value: string}, order matters
  onChange: PropTypes.func.isRequired, // (selectedId: string) => any
  idPrefix: PropTypes.string.isRequired,
  sort: PropTypes.bool, // sorted alphabetically by current locale with { numeric: true } if true
}

export default SelectBox
