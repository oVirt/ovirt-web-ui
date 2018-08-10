import React from 'react'
import PropTypes from 'prop-types'
import {
  Badge,
  Button,
  Card,
  CardHeading,
  CardTitle,
  CardBody,
  CardFooter,
  Icon,
  noop,
  excludeKeys,
} from 'patternfly-react'

import style from './style.css'
import CardEditButton from './CardEditButton'

/**
 * Base VM details card.  Support common layouts and view vs edit modes.
 *
 * Specifying __editMode__ allows the containing component to control the card's
 * edit state.  Leave __editMode__ undefined to allow the card to control itself.
 *
 * When the user interacts with the card, the card will fire event handler:
 *  - When in non-edit state, user clicks the __Edit__ icon -> onStartEdit() is called
 *  - When in edit state, user clicks the __Cancel__ button -> onCancel() is called
 *  - When in edit state, user clicks the __Save__ button -> onSave() is called
 *
 * If any of the event handlers return false, the card will not transition its edit state.
 * This allows data validation or async operation completion.
 */
class BaseCard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      edit: props.editMode,
    }
    this.propTypeKeys = Object.keys(BaseCard.propTypes)
  }

  clickEdit = () => {
    if (this.props.onStartEdit() !== false) {
      this.setState({ edit: true })
    }
  }

  clickCancel = () => {
    if (this.props.onCancel() !== false) {
      this.setState({ edit: false })
    }
  }

  clickSave = () => {
    if (this.props.onSave() !== false) {
      this.setState({ edit: false })
    }
  }

  render () {
    const {
      title = undefined,
      icon = undefined,
      itemCount = undefined,
      editMode = undefined,
      editable = true,
      editTooltip,
      children = noop,
    } = this.props
    const editing = editMode === undefined ? this.state.edit : editMode
    const hasHeading = !!title
    const hasBadge = itemCount !== undefined
    const hasIcon = icon && icon.type && icon.name

    return (
      <Card className={style['base-card']} {...excludeKeys(this.props, this.propTypeKeys)}>
        {hasHeading && (
          <CardHeading className={style['base-card-heading']}>
            {editable && <CardEditButton tooltip={editTooltip} editEnabled={editing} onClick={this.clickEdit} />}
            <CardTitle>
              {hasIcon && <Icon type={icon.type} name={icon.name} className={style['base-card-title-icon']} />}
              {title}
              {hasBadge && <Badge className={style['base-card-item-count-badge']}>{itemCount}</Badge>}
            </CardTitle>
          </CardHeading>
        )}

        <CardBody className={style['base-card-body']}>
          {(!hasHeading && editable) && (
            <CardEditButton tooltip={editTooltip} editEnabled={editing} onClick={this.clickEdit} />
          )}

          {children({ isEditing: editing })}
        </CardBody>

        {editing && (
          <CardFooter className={style['base-card-footer']}>
            <Button bsStyle='primary' onClick={this.clickSave}><Icon type='fa' name='check' /></Button>
            <Button onClick={this.clickCancel}><Icon type='pf' name='close' /></Button>
          </CardFooter>
        )}
      </Card>
    )
  }
}
BaseCard.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.shape({
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  itemCount: PropTypes.number,

  editMode: PropTypes.bool,
  editable: PropTypes.bool,
  editTooltip: PropTypes.string,

  onStartEdit: PropTypes.func,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  children: PropTypes.func,
}
BaseCard.defaultProps = {
  onStartEdit: noop,
  onCancel: noop,
  onSave: noop,
}

export default BaseCard
