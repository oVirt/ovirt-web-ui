import React from 'react'
import PropTypes from 'prop-types'
import { excludeKeys, DropdownButton, MenuItem } from 'patternfly-react'

import { hrefWithoutHistory } from '_/helpers'

import style from './style.css'

class Action extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showModal: false }
    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleOpen (e) {
    if (e && e.preventDefault) e.preventDefault()
    this.setState({ showModal: true })
    this.props.children.props.onClick && this.props.children.props.onClick(e)
  }

  handleClose () {
    this.setState({ showModal: false })
  }

  render () {
    const { children, confirmation } = this.props
    let trigger = children
    let confirmationDialog = confirmation || null
    if (confirmation) {
      trigger = React.cloneElement(trigger, { onClick: this.handleOpen })
      confirmationDialog = React.cloneElement(confirmationDialog, { show: this.state.showModal, onClose: this.handleClose })
    }
    return <React.Fragment>
      {trigger}
      {confirmationDialog}
    </React.Fragment>
  }
}
Action.propTypes = {
  children: PropTypes.node.isRequired,
  confirmation: PropTypes.node,
}

export default Action

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
        <a href='#' onClick={handleClick} className={`${className} ${style['link']}`} id={id}>
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

const MenuItemAction = ({ id, confirmation, shortTitle, icon, onClick }) => {
  return <Action confirmation={confirmation}>
    <MenuItem
      id={id}
      onClick={() => {
        onClick && onClick()
        document.dispatchEvent(new MouseEvent('click'))
      }}
    >
      <span>{shortTitle}</span> { icon }
    </MenuItem>
  </Action>
}

MenuItemAction.propTypes = {
  id: PropTypes.string.isRequired,
  confirmation: PropTypes.node,
  shortTitle: PropTypes.string.isRequired,
  icon: PropTypes.node,
  onClick: PropTypes.func,
}

const ActionButtonWraper = (props) => {
  const btnProps = excludeKeys(props, [ 'confirmation', 'items' ])
  const { items, actionDisabled, confirmation, shortTitle } = props
  if (items && items.filter(i => i !== null).length > 0) {
    return <DropdownButton
      title={shortTitle}
      bsStyle={props.bsStyle}
      id='console-selector'
      disabled={actionDisabled}
    >
      { items.filter(i => i !== null).map(item => {
        return <MenuItemAction key={item.id} {...item} />
      }) }
    </DropdownButton>
  }
  return <Action confirmation={confirmation} key={shortTitle}><Button {...btnProps} /></Action>
}
ActionButtonWraper.propTypes = {
  confirmation: PropTypes.node,
  items: PropTypes.array,
  ...Button.propTypes,
}

export { ActionButtonWraper, MenuItemAction }
