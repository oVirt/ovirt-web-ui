import React from 'react'
import PropTypes from 'prop-types'

import style from './style.css'

import { Link } from 'react-router-dom'

const LinkButton = ({ className, tooltip, to, actionDisabled, isOnCard, shortTitle, button, id }) => {
  if (actionDisabled) {
    className = `${className} ${style['action-disabled']}`
    to = undefined
  }

  if (isOnCard) {
    return (
      <div className='card-pf-item'>
        <Link to={to}>
          <span className={className} data-toggle='tooltip' data-placement='left' title={tooltip} id={id} />
        </Link>
      </div>
    )
  }

  if (actionDisabled) {
    return (
      <button className={`${button} ${style['disabled-button']}`} disabled='disabled' id={id}>
        <span data-toggle='tooltip' data-placement='left' title={tooltip}>
          {shortTitle}
        </span>
      </button>
    )
  }

  return (
    <Link to={to} className={`${button} ${style['link']} ${style['full-button']}`}>
      <span data-toggle='tooltip' data-placement='left' title={tooltip} id={id}>
        {shortTitle}
      </span>
    </Link>
  )
}

LinkButton.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  shortTitle: PropTypes.string.isRequired,
  button: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  actionDisabled: PropTypes.bool,
  isOnCard: PropTypes.bool.isRequired,
  id: PropTypes.string,
}

export default LinkButton
