import React from 'react'
import PropTypes from 'prop-types'

import { OverlayTrigger, Popover } from 'react-bootstrap'

import { msg } from '../../intl'
import style from './style.css'

/**
 * Renders underlined `text` with `tooltip`.
 * A popover is shown consisting of `title` and `content` on click.
 */
class FieldHelp extends React.Component {

  render () {
    const tooltip = this.props.tooltip || msg.clickForHelp()

    const popover = (
      <Popover id='popover-positioned-top' className={style['field-help-min-width']} title={this.props.title}>
        {this.props.content}
      </Popover>)

    const container = this.props.container === null ? undefined : this.props.container || this
    return (
      <OverlayTrigger trigger='click' rootClose placement='top' overlay={popover} container={container}>
        <div role='button' title={tooltip} className={this.props.text && style['field-text']} style={{ position: 'relative' }}>
          {this.props.text}
          {this.props.children}
        </div>
      </OverlayTrigger>
    )
  }
}

FieldHelp.propTypes = {
  title: PropTypes.string,                                            // popover title
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),   // popover content
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),      // decorated text
  tooltip: PropTypes.string,                                          // tooltip shown when hovering the text
  children: PropTypes.any,
  container: PropTypes.any,
}

export default FieldHelp
