import React from 'react'
import PropTypes from 'prop-types'
import { sortedBy } from '_/helpers'

import style from './sharedStyle.css'
import { Tooltip } from '_/components/tooltips'
import { withMsg } from '_/intl'

const NOBREAK_SPACE = '\u00A0'

function getSelectedId (props) {
  return props.selected == null ? (props.items.length > 0 ? props.items[0].id : null) : props.selected
}

function getItems ({ sort, items, locale }) {
  return sort ? sortedBy(items, 'value', locale) : items
}

const MarkAsDefault = withMsg(({ msg, value, isDefault }) => {
  if (!isDefault) {
    return value
  }
  return (<React.Fragment>{value}{NOBREAK_SPACE}<i>{msg.defaultOption()}</i></React.Fragment>
  )
})

/*
 * TODO: Update this to use a patternfly-react component. Probably use a width styled
 *       __DropdownButton__ with a set of scrolling __MenuItem__s.
 */

class SelectBox extends React.Component {
  constructor (props) {
    super(props)
    const { sort, items, locale } = this.props
    this.state = {
      selected: getSelectedId(props),
      items: getItems({ sort, items, locale }),
    }
    this.handleChange = this.handleChange.bind(this)
    this.getValidationClass = this.getValidationClass.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    const { sort, items, locale } = nextProps
    const nextState = { items: getItems({ sort, items, locale }) }
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

  getValidationClass () {
    const { validationState } = this.props
    switch (validationState) {
      case 'error':
        return style['selectBox-has-error']
      default:
        return ''
    }
  }

  render () {
    const { id, disabled } = this.props

    const selectedItem = this.state.items.find(item => item.id === this.state.selected)
    const validationClass = this.getValidationClass()

    return (
      <div style={{ width: '100%' }} id={id}>
        <div className='dropdown'>
          <Tooltip id={`${id}-selectbox-tooltip`} placement={'bottom'} tooltip={selectedItem ? selectedItem.value : ''}>
            <button
              className={`btn btn-default dropdown-toggle ${style['dropdown-button']} ${validationClass}`}
              type='button'
              data-toggle='dropdown'
              id={`${id}-button-toggle`}
              disabled={disabled}
            >
              <span className={style['dropdown-button-text']} id={`${id}-button-text`} >
                {selectedItem ? <MarkAsDefault {...selectedItem} /> : NOBREAK_SPACE}
              </span>
              <span className='caret' id={`${id}-button-caret`} />
            </button>
          </Tooltip>
          <ul className={`dropdown-menu ${style['dropdown']}`} role='menu'>
            {this.state.items.map(item => (
              <li role='presentation' className={item.id === this.state.selected ? 'selected' : ''} key={item.id}>
                <a role='menuitem' tabIndex='-1' onClick={this.handleChange(item.id)} id={`${id}-item-${item.value}`}>
                  {<MarkAsDefault {...item} />}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
}

SelectBox.propTypes = {
  /* eslint-disable react/no-unused-prop-types */
  selected: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // id of a selected item, false-ish for the first item
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.string,
    isDefault: PropTypes.bool,
  })).isRequired, // Array<{ id: string, value: string }>, order matters if sort is false-ish
  sort: PropTypes.bool, // sorted alphabetically by current locale with { numeric: true } if true
  /* eslint-enable react/no-unused-prop-types */
  onChange: PropTypes.func.isRequired, // (selectedId: string) => any
  id: PropTypes.string,
  validationState: PropTypes.oneOf([ false, 'default', 'error' ]),
  disabled: PropTypes.bool,
  locale: PropTypes.string.isRequired,
}

export default withMsg(SelectBox)
