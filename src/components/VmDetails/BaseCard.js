import React from 'react'
import PropTypes from 'prop-types'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
} from '@patternfly/react-core'

import style from './style.css'
import CardEditButton from './CardEditButton'
import { Tooltip } from '_/components/tooltips'
import { CheckIcon, TimesIcon } from '@patternfly/react-icons/dist/esm/icons'

/**
 * Base VM details card.  Support common layouts and view vs edit modes.
 *
 * Content of the component may vary based on the edit state of the card. Children
 * may be a function of the form -
 *   ({ isEditing }) => ...
 *
 * an element of the form -
 *   <Element isEditing={true/false} />
 *
 * or any other node type.
 *
 * __editMode__ allows the containing component to control the card's edit state.
 *              Leave it undefined to allow the card to control itself.
 *
 * As a user interacts with the card, events are fired. If any of the event
 * handlers return false, the card will not transition its edit state. This
 * allows data validation or async operation completion.
 *
 *   Events while in non-edit state -
 *     user clicks the __Edit__ icon -> onStartEdit()
 *
 *   Events while in edit state -
 *     user clicks the __Cancel__ button -> onCancel()
 *     user clicks the __Save__ button -> onSave()
 */
class BaseCard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      edit: props.editMode || false,
    }
    this.propTypeKeys = Object.keys(BaseCard.propTypes)

    this.clickEdit = this.clickEdit.bind(this)
    this.clickCancel = this.clickCancel.bind(this)
    this.clickSave = this.clickSave.bind(this)
    this.renderChildren = this.renderChildren.bind(this)
  }

  clickEdit () {
    if (this.props.onStartEdit() !== false) {
      this.setState({ edit: true })
    }
  }

  clickCancel () {
    if (this.props.onCancel() !== false) {
      this.setState({ edit: false })
    }
  }

  clickSave () {
    if (this.props.onSave() !== false) {
      this.setState({ edit: false })
    }
  }

  renderChildren (childProps) {
    const children = this.props.children || (() => {})
    return typeof children === 'function'
      ? children(childProps)
      : React.isValidElement(children)
        ? React.cloneElement(children, childProps)
        : children
  }

  render () {
    const {
      title = undefined,
      icon: TheIcon = undefined,
      itemCount = undefined,
      editMode = undefined,
      editable = true,
      editTooltip,
      idPrefix = '',
      className = '',
      disableSaveButton = false,
      disableTooltip = undefined,
      editTooltipPlacement = 'top',
    } = this.props
    const editing = editMode === undefined ? this.state.edit : editMode
    const hasHeading = !!title
    const hasBadge = itemCount !== undefined

    const RenderChildren = this.renderChildren
    return (
      <Card className={`${style['base-card']} ${className}`} id={`${idPrefix}-card` } isCompact>
        {hasHeading && (
          <CardHeader className={style['base-card-heading']}>

            <CardTitle>
              {TheIcon && <TheIcon className={style['base-card-title-icon']} />}
              {title}
              {hasBadge && <Badge isRead className={style['base-card-item-count-badge']}>{itemCount}</Badge>}
            </CardTitle>
            <CardEditButton
              tooltip={editTooltip}
              editable={editable}
              disableTooltip={disableTooltip}
              editEnabled={editing}
              onClick={this.clickEdit}
              id={`${idPrefix}-button-edit`}
              placement={editTooltipPlacement}
            />
          </CardHeader>
        )}

        <CardBody className={style['base-card-body']}>
          {!hasHeading && (
            <CardEditButton
              tooltip={editTooltip}
              editable={editable}
              disableTooltip={disableTooltip}
              editEnabled={editing}
              onClick={this.clickEdit}
              id={`${idPrefix}-button-edit`}
              placement={editTooltipPlacement}
            />
          )}

          <RenderChildren isEditing={editing} />
        </CardBody>

        {editing && (
          <CardFooter className={style['base-card-footer']}>
            <Button isDisabled={disableSaveButton} onClick={this.clickSave} id={`${idPrefix}-button-save`} icon={<CheckIcon />}/>
            <Button onClick={this.clickCancel} id={`${idPrefix}-button-cancel`} icon={<TimesIcon />} variant='link'/>
          </CardFooter>
        )}
      </Card>
    )
  }
}
BaseCard.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.any,
  itemCount: PropTypes.number,
  idPrefix: PropTypes.string,
  className: PropTypes.string,

  editMode: PropTypes.bool,
  editable: PropTypes.bool,
  disableSaveButton: PropTypes.bool,
  editTooltip: PropTypes.oneOfType([Tooltip.propTypes.tooltip]),
  disableTooltip: PropTypes.oneOfType([Tooltip.propTypes.tooltip]),
  editTooltipPlacement: Tooltip.propTypes.placement,

  onStartEdit: PropTypes.func,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
}
BaseCard.defaultProps = {
  onStartEdit: () => {},
  onCancel: () => {},
  onSave: () => {},
}

export default BaseCard
