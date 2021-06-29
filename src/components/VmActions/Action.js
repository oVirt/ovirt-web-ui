import React from 'react'
import PropTypes from 'prop-types'
import { DropdownButton, MenuItem } from 'patternfly-react'

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

    const trigger = confirmation
      ? React.cloneElement(children, { onClick: this.handleOpen })
      : children

    const confirmationDialog = confirmation
      ? React.cloneElement(confirmation, { show: this.state.showModal, onClose: this.handleClose })
      : null

    return (
      <>
        {trigger}
        {confirmationDialog}
      </>
    )
  }
}
Action.propTypes = {
  children: PropTypes.node.isRequired,
  confirmation: PropTypes.node,
}

const Button = ({
  className,
  tooltip = '',
  shortTitle,
  onClick = () => {},
  actionDisabled = false,
  id,
}) => {
  const handleClick = hrefWithoutHistory(onClick)

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
      <a href='#' onClick={handleClick} className={`${className} ${style.link}`} id={id}>
        <span data-toggle='tooltip' data-placement='left' title={tooltip} id={`${id}-title`}>
          {shortTitle}
        </span>
      </a>
    </span>
  )
}
Button.propTypes = {
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  shortTitle: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  actionDisabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
}

const MenuItemAction = ({
  confirmation,
  onClick,
  shortTitle,
  icon,
  actionDisabled = false,
  id,
  className,
}) => {
  return (
    <Action confirmation={confirmation}>
      <MenuItem
        disabled={actionDisabled}
        onClick={(...args) => {
          onClick && onClick(...args)
          document.dispatchEvent(new MouseEvent('click'))
        }}
        id={id}
        className={className}
      >
        <span>{shortTitle}</span> {icon}
      </MenuItem>
    </Action>
  )
}
MenuItemAction.propTypes = {
  id: PropTypes.string.isRequired,
  confirmation: PropTypes.node,
  onClick: PropTypes.func,
  shortTitle: PropTypes.string.isRequired,
  icon: PropTypes.node,
  className: PropTypes.string,
  actionDisabled: PropTypes.bool,
}

const ActionButtonWraper = ({ items, confirmation, actionDisabled, shortTitle, bsStyle, ...rest }) => {
  if (items && items.filter(i => i !== null).length > 0) {
    return (
      <DropdownButton
        title={shortTitle}
        bsStyle={bsStyle}
        id='console-selector'
        disabled={actionDisabled}
      >
        {
        items.filter(i => i !== null && !i.actionDisabled).map(
          item => <MenuItemAction key={item.id} {...item} />
        )
      }
      </DropdownButton>
    )
  }

  return (
    <Action confirmation={confirmation} key={shortTitle}>
      <Button actionDisabled={actionDisabled} shortTitle={shortTitle} {...rest} />
    </Action>
  )
}
ActionButtonWraper.propTypes = {
  confirmation: PropTypes.node,
  items: PropTypes.array,
  ...Button.propTypes,
}

const ActionMenuItemWrapper = ({ id, className, items, confirmation, actionDisabled, shortTitle, ...rest }) => {
  // For console button
  if (items && items.filter(i => i !== null).length > 0) {
    if (actionDisabled) {
      return (
        <MenuItemAction
          shortTitle={shortTitle}
          id='console-selector'
          actionDisabled
        />
      )
    } else {
      return (
        <>
          <MenuItem divider />
          {
          items.filter(i => i !== null && !i.actionDisabled).map(
            item => <MenuItemAction key={item.id} {...item} />
          )
        }
          <MenuItem divider />
        </>
      )
    }
  }

  const menuClassName = (!actionDisabled && /btn-danger/.test(className)) ? style['menu-item-danger'] : ''
  return (
    <MenuItemAction
      {...rest}
      shortTitle={shortTitle}
      id={`${id}-kebab`}
      key={id}
      confirmation={!actionDisabled && confirmation}
      className={menuClassName}
    />
  )
}
ActionMenuItemWrapper.propTypes = {
  items: PropTypes.array,
  confirmation: PropTypes.node,
  actionDisabled: PropTypes.bool,

  // modified from MenuItemAction.propTypes
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  shortTitle: PropTypes.string.isRequired,
  icon: PropTypes.node,
  className: PropTypes.string,
}

export default Action
export { ActionButtonWraper, MenuItemAction, ActionMenuItemWrapper }
