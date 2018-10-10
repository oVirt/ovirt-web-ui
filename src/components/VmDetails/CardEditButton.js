import React from 'react'
import PropTypes from 'prop-types'
import {
  Icon,
  noop,
} from 'patternfly-react'

import style from './style.css'

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
    const { tooltip, id } = this.props
    const { editEnabled } = this.state

    const classes = `${style['card-edit-button']} ${style[editEnabled ? 'card-edit-button-enabled' : 'card-edit-button-disabled']}`
    const myClick = editEnabled ? noop : this.enableEditHandler

    return (
      <a title={tooltip} onClick={(e) => { e.preventDefault(); myClick() }} className={classes} id={id}>
        <Icon type='pf' name='edit' />
      </a>
    )
  }
}
CardEditButton.propTypes = {
  tooltip: PropTypes.string,
  editEnabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func,
}
CardEditButton.defaultProps = {
  tooltip: '',
  editEnabled: false,
  onClick: noop,
}

export default CardEditButton
