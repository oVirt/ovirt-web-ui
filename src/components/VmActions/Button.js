import React from 'react'
import PropTypes from 'prop-types'

import style from './style.css'

import { hrefWithoutHistory } from '../../helpers'

import Popover from '../Confirmation/Popover'

class Button extends React.Component {
  constructor (props) {
    super(props)
    this.state = { show: false }
    this.handleClick = e => {
      this.setState({ show: !this.state.show })
    }
    this.closePopover = this.closePopover.bind(this)
  }

  closePopover () {
    this.setState({ show: false })
  }

  render () {
    let {
      className,
      tooltip = '',
      actionDisabled = false,
      isOnCard,
      onClick,
      shortTitle,
      button,
      popover,
      id,
    } = this.props

    let handleClick = hrefWithoutHistory(onClick)
    let popoverComponent = null
    if (popover) {
      handleClick = this.handleClick
      const PopoverBody = popover
      popoverComponent = (<Popover show={this.state.show} width={200} height={80} target={this} placement={isOnCard ? 'top' : 'bottom'}>
        <PopoverBody close={this.closePopover} />
      </Popover>)
    }

    if (actionDisabled) {
      className = `${className} ${style['action-disabled']}`
      handleClick = undefined
    }

    if (isOnCard) {
      return (
        <div className='card-pf-item'>
          <span className={className} data-toggle='tooltip' data-placement='left' title={tooltip} onClick={handleClick} id={id} />
          {popoverComponent}
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
      <span className={style['full-button']}>
        <a href='#' onClick={handleClick} className={`${button} ${style['link']}`} id={shortTitle}>
          <span data-toggle='tooltip' data-placement='left' title={tooltip} id={`${id}-title`}>
            {shortTitle}
          </span>
        </a>
        {popoverComponent}
      </span>
    )
  }
}
Button.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  shortTitle: PropTypes.string.isRequired,
  button: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  actionDisabled: PropTypes.bool,
  isOnCard: PropTypes.bool.isRequired,
  popover: PropTypes.func,
  id: PropTypes.string.isRequired,
}

export default Button
