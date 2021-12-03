import React from 'react'
import PropTypes from 'prop-types'
import { sortedBy } from '_/helpers'

import style from './sharedStyle.css'
import { Tooltip } from '_/components/tooltips'
import { withMsg } from '_/intl'

const NOBREAK_SPACE = '\u00A0'

const MarkAsDefault = withMsg(({ msg, value, isDefault }) => {
  if (!isDefault) {
    return value
  }
  return (<>{value}{NOBREAK_SPACE}<i>{msg.defaultOption()}</i></>
  )
})

/*
 * TODO: Update this to use a patternfly-react component. Probably use a width styled
 *       __DropdownButton__ with a set of scrolling __MenuItem__s.
 */

const SelectBox = ({ sort, items = [], locale, selected, onChange, validationState, id, disabled }) => {
  if (sort) {
    sortedBy(items, 'value', locale)
  }
  const selectedId = selected ?? items?.[0]?.id ?? null
  const validationClass = validationState === 'error' ? style['selectBox-has-error'] : ''
  const selectedItem = items.find(item => item.id === selectedId)

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
        <ul className={`dropdown-menu ${style.dropdown}`} role='menu'>
          {items.map(item => (
            <li role='presentation' className={item.id === selectedId ? 'selected' : ''} key={item.id}>
              <a role='menuitem' tabIndex='-1' onClick={() => onChange(item.id)} id={`${id}-item-${item.value}`}>
                {<MarkAsDefault {...item} />}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
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
  validationState: PropTypes.oneOf([false, 'default', 'error']),
  disabled: PropTypes.bool,
  locale: PropTypes.string.isRequired,
}

export default withMsg(SelectBox)
