import React from 'react'
import PropTypes from 'prop-types'
import {
  Icon,
} from 'patternfly-react'

import style from './style.css'

/**
 * Render the edit icon/button to enable/disable the editing of the content of a card.
 */
class CardEditButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      enabled: props.enabled,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.enabled !== props.enabled) {
      return { enabled: props.enabled }
    }

    return null
  }

  render () {
    const { tooltip, onClick } = this.props
    const { enabled } = this.state

    const classes = `${style['card-edit-button']} ${style[enabled ? 'card-edit-button-enabled' : 'card-edit-button-disabled']}`
    const myClick = enabled
      ? () => {}
      : () => {
        onClick({ enabled: !enabled })
        this.setState({ enabled: !enabled })
      }

    return (
      <a title={tooltip} onClick={myClick} className={classes}>
        <Icon type='pf' name='edit' />
      </a>
    )
  }
}
CardEditButton.propTypes = {
  tooltip: PropTypes.string,
  enabled: PropTypes.bool,
  onClick: PropTypes.func,
}
CardEditButton.defaultProps = {
  tooltip: '',
  enabled: false,
  onClick: () => {},
}

export default CardEditButton
