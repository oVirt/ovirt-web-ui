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
} from 'patternfly-react'

import style from './style.css'
import CardEditButton from './CardEditButton'

/**
 * Base VM details card.  Support common layouts and view vs edit modes.
 */
class BaseCard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      edit: false,
    }
  }

  render () {
    const {
      title = undefined,
      icon = undefined,
      itemCount = undefined,
      editable = true,
      editTooltip,
      onCancel = noop,
      onSave = noop,
      children = noop,
      ...extraProps
    } = this.props
    const editing = this.state.edit
    const hasHeading = !!title
    const hasBadge = itemCount !== undefined
    const hasIcon = icon && icon.type && icon.name

    const renderedChildren = React.isValidElement(children) ? React.cloneElement(children, { isEditing: editing }) : children({ isEditing: editing })

    const clickEdit = () => {
      this.setState({ edit: true })
    }
    const clickCancel = () => {
      this.setState({ edit: false })
      onCancel()
    }
    const clickSave = () => {
      this.setState({ edit: false })
      onSave()
    }

    return (
      <Card {...extraProps}>
        {hasHeading && (
          <CardHeading>
            {editable && <CardEditButton tooltip={editTooltip} enabled={editing} onClick={clickEdit} />}
            <CardTitle>
              {hasIcon && <Icon type={icon.type} name={icon.name} className={style['card-item-title-icon']} />}
              {title}
              {hasBadge && <Badge className={style['card-item-count-badge']}>{itemCount}</Badge>}
            </CardTitle>
          </CardHeading>
        )}
        <CardBody>
          {(!hasHeading && editable) && (
            <CardEditButton tooltip={editTooltip} enabled={editing} onClick={clickEdit} />
          )}

          {renderedChildren}
        </CardBody>
        {editing && (
          <CardFooter>
            <Button bsStyle='primary' onClick={clickSave}><Icon type='fa' name='check' /></Button>
            <Button onClick={clickCancel}><Icon type='pf' name='close' /></Button>
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
  editable: PropTypes.bool,
  editTooltip: PropTypes.string,

  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]),
}

export default BaseCard
