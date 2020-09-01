import React from 'react'
import PropTypes from 'prop-types'
import {
  Icon,
  noop,
} from 'patternfly-react'

import style from './style.css'

import OverlayTooltip from '../OverlayTooltip'
import { tooltipPropType, tooltipPositionPropType } from '_/propTypeShapes'
/**
 * Render the edit icon/button to enable the editing of the content of a card.
 *
 * Once enabled, no user interaction can disable it. The containing component will
 * need other ways to disable/cancel an edit and update this button to be !enabled.
 */
class CardEditButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      editEnabled: props.editEnabled,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.editEnabled !== props.editEnabled) {
      return { editEnabled: props.editEnabled }
    }

    return null
  }

  enableEditHandler = () => {
    if (!this.state.editEnabled) {
      this.props.onClick({ editEnabled: true })
      this.setState({ editEnabled: true })
    }
  }

  render () {
    const { tooltip, id, editable, disableTooltip, placement = 'top' } = this.props
    const { editEnabled } = this.state

    const classes = `${style['card-edit-button']} ${style[editEnabled ? 'card-edit-button-enabled' : 'card-edit-button-disabled']}`
    const myClick = editEnabled ? noop : this.enableEditHandler

    if (!editable && disableTooltip) {
      return (<OverlayTooltip
        tooltip={<span>{disableTooltip}</span>}
        placement={placement}
        id={`${id}-card-edit-button-tooltip`}
      >
        <a className={`${style['card-edit-button']} ${style['card-edit-button-disabled']}`} id={id}>
          <Icon type='pf' name='edit' />
        </a>
      </OverlayTooltip>)
    }
    if (!editable) {
      return null
    }

    return (
      <OverlayTooltip id={`${id}-tooltip`} tooltip={tooltip} placement={placement}>
        <a id={id} className={classes} onClick={(e) => { e.preventDefault(); myClick() }}>
          <Icon type='pf' name='edit' />
        </a>
      </OverlayTooltip>
    )
  }
}
CardEditButton.propTypes = {
  tooltip: tooltipPropType,
  editEnabled: PropTypes.bool,
  editable: PropTypes.bool,
  disableTooltip: tooltipPropType,
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  placement: tooltipPositionPropType,
}
CardEditButton.defaultProps = {
  tooltip: '',
  editEnabled: false,
  onClick: noop,
}

export default CardEditButton
