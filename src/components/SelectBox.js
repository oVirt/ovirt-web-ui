import React from 'react'
import PropTypes from 'prop-types'
import { sortedBy } from '_/helpers'

import style from './sharedStyle.css'

const NOBREAK_SPACE = '\u00A0'

function getSelectedId (props) {
  return props.selected == null ? (props.items.length > 0 ? props.items[0].id : null) : props.selected
}

function getItems (props) {
  return props.sort ? sortedBy(props.items, 'value') : props.items
}

/*
 * TODO: Update this to use a patternfly-react component. Probably use a width styled
 *       __DropdownButton__ with a set of scrolling __MenuItem__s.
 */

class SelectBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      selected: getSelectedId(props),
      items: getItems(props),
    }
    this.handleChange = this.handleChange.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    const nextState = { items: getItems(nextProps) }
    if (this.props.selected !== nextProps.selected) {
      nextState.selected = getSelectedId(nextProps)
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
    const { id } = this.props

    const selectedItem = this.state.items.find(item => item.id === this.state.selected)

    return (
      <div style={{ width: '100%' }} id={id}>
        <div className='dropdown'>
          <button className={`btn btn-default dropdown-toggle ${style['dropdown-button']}`} type='button' data-toggle='dropdown' id={`${id}-button-toggle`}>
            <span className={style['dropdown-button-text']} id={`${id}-button-text`} title={selectedItem && selectedItem.value}>
              {selectedItem ? selectedItem.value : NOBREAK_SPACE}
            </span>
            <span className='caret' id={`${id}-button-caret`} />
          </button>
          <ul className={`dropdown-menu ${style['dropdown']}`} role='menu'>
            {this.state.items.map(item => (
              <li role='presentation' className={item.id === this.state.selected ? 'selected' : ''} key={item.id}>
                <a role='menuitem' tabIndex='-1' onClick={this.handleChange(item.id)} id={`${id}-item-${item.value}`}>
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
  /* eslint-disable react/no-unused-prop-types */
  selected: PropTypes.string, // id of a selected item, false-ish for the first item
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    value: PropTypes.string,
  })).isRequired, // Array<{ id: string, value: string }>, order matters if sort is false-ish
  sort: PropTypes.bool, // sorted alphabetically by current locale with { numeric: true } if true
  /* eslint-enable react/no-unused-prop-types */
  onChange: PropTypes.func.isRequired, // (selectedId: string) => any
  id: PropTypes.string,
}

export default SelectBox
