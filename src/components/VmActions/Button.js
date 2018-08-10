import React from 'react'
import PropTypes from 'prop-types'

import style from './style.css'

import { hrefWithoutHistory } from '../../helpers'

class Button extends React.Component {
  render () {
    let {
      className,
      tooltip = '',
      actionDisabled = false,
      onClick,
      shortTitle,
      id,
    } = this.props

    let handleClick = hrefWithoutHistory(onClick)

    if (actionDisabled) {
      return (
        <button className={`${className} ${style['disabled-button']}`} disabled='disabled' id={id}>
          <span data-toggle='tooltip' data-placement='left' title={tooltip}>
            {shortTitle}
          </span>
        </button>
      )
    }

    return (
      <span className={style['full-button']}>
        <a href='#' onClick={handleClick} className={`${className} ${style['link']}`} id={shortTitle}>
          <span data-toggle='tooltip' data-placement='left' title={tooltip} id={`${id}-title`}>
            {shortTitle}
          </span>
        </a>
      </span>
    )
  }
}
Button.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  shortTitle: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  actionDisabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
}

export default Button
