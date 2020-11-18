import React from 'react'
import PropTypes from 'prop-types'
import {
  Icon,
  noop,
} from 'patternfly-react'

import style from './style.css'

import { Tooltip } from '_/components/tooltips'
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
      return (<Tooltip
        tooltip={<span>{disableTooltip}</span>}
        placement={placement}
        id={`${id}-card-edit-button-tooltip`}
      >
        <a className={`${style['card-edit-button']} ${style['card-edit-button-disabled']}`} id={id}>
          <Icon type='pf' name='edit' />
        </a>
      </Tooltip>)
    }
    if (!editable) {
      return null
    }

    return (
      <Tooltip id={`${id}-tooltip`} tooltip={tooltip} placement={placement}>
        <a id={id} className={classes} onClick={(e) => { e.preventDefault(); myClick() }}>
          <Icon type='pf' name='edit' />
        </a>
      </Tooltip>
    )
  }
}
CardEditButton.propTypes = {
  tooltip: Tooltip.propTypes.tooltip,
  editEnabled: PropTypes.bool,
  editable: PropTypes.bool,
  disableTooltip: PropTypes.oneOfType([ Tooltip.propTypes.tooltip ]),
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  placement: Tooltip.propTypes.placement,
}
CardEditButton.defaultProps = {
  tooltip: '',
  editEnabled: false,
  onClick: noop,
}

export default CardEditButton
