import React from 'react'
import PropTypes from 'prop-types'
import { excludeKeys, DropdownButton, MenuItem, noop } from 'patternfly-react'

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

const Button = ({
  className,
  tooltip = '',
  shortTitle,
  onClick = noop,
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
      <a href='#' onClick={handleClick} className={`${className} ${style['link']}`} id={id}>
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

const MenuItemAction = ({ confirmation, onClick, shortTitle, icon, ...rest }) => {
  return <Action confirmation={confirmation}>
    <MenuItem
      onClick={(...args) => {
        onClick && onClick(...args)
        document.dispatchEvent(new MouseEvent('click'))
      }}
      {...rest}
    >
      <span>{shortTitle}</span> {icon}
    </MenuItem>
  </Action>
}
MenuItemAction.propTypes = {
  id: PropTypes.string.isRequired,
  confirmation: PropTypes.node,
  onClick: PropTypes.func,
  shortTitle: PropTypes.string.isRequired,
  icon: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
}

const ActionButtonWraper = (props) => {
  const { items, actionDisabled, confirmation, shortTitle } = props
  const btnProps = excludeKeys(props, [ 'confirmation', 'items' ])

  if (items && items.filter(i => i !== null).length > 0) {
    return <DropdownButton
      title={shortTitle}
      bsStyle={props.bsStyle}
      id='console-selector'
      disabled={actionDisabled}
    >
      {
        items.filter(i => i !== null && !i.actionDisabled).map(
          item => <MenuItemAction key={item.id} {...item} />
        )
      }
    </DropdownButton>
  }

  return <Action confirmation={confirmation} key={shortTitle}>
    <Button {...btnProps} />
  </Action>
}
ActionButtonWraper.propTypes = {
  confirmation: PropTypes.node,
  items: PropTypes.array,
  ...Button.propTypes,
}

const ActionMenuItemWrapper = (props) => {
  const { items, actionDisabled, shortTitle } = props

  // For console button
  if (items && items.filter(i => i !== null).length > 0) {
    if (actionDisabled) {
      return <MenuItemAction
        shortTitle={shortTitle}
        id='console-selector'
        disabled
      />
    } else {
      return <React.Fragment>
        <MenuItem divider />
        {
          items.filter(i => i !== null && !i.actionDisabled).map(
            item => <MenuItemAction key={item.id} {...item} />
          )
        }
        <MenuItem divider />
      </React.Fragment>
    }
  }

  const menuProps = excludeKeys(props, [ 'confirmation', 'items' ])
  const menuClassName = (!actionDisabled && /btn-danger/.test(props.className)) ? style['menu-item-danger'] : ''
  return (
    <MenuItemAction
      {...menuProps}
      id={`${props.id}-kebab`}
      key={props.id}
      confirmation={!actionDisabled && props.confirmation}
      disabled={actionDisabled}
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
