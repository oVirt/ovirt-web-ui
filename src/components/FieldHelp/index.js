import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import $ from 'jquery'

import { Popover, OverlayTrigger } from 'react-bootstrap'

import { withMsg } from '_/intl'
import style from './style.css'

/**
 * Renders underlined `text` with `tooltip`.
 * A popover is shown consisting of `title` and `content` on click.
 */
class FieldHelp extends React.Component {
  constructor (props) {
    super(props)
    this.state = { style: null, placement: 'top' }
    this.position = null
  }
  componentDidMount () {
    const position = ReactDOM.findDOMNode(this).getBoundingClientRect()
    this.setState({ position })
  }

  componentWillReceiveProps (nextProps) {
    let placement = 'top'
    const popoverStyle = {}
    const parent = $(ReactDOM.findDOMNode(this)).parents('[container]')
    if (parent.length) {
      const position = ReactDOM.findDOMNode(this).getBoundingClientRect()
      const parentPosition = parent.get(0).getBoundingClientRect()
      const maxHeight = position.top - parentPosition.top
      if (maxHeight > 80) {
        popoverStyle['maxHeight'] = maxHeight
      } else {
        placement = 'bottom'
      }

      popoverStyle['maxWidth'] = parentPosition.right - position.left
      popoverStyle['maxWidth'] = popoverStyle['maxWidth'] > 250 ? 250 : popoverStyle['maxWidth']
    }
    this.setState({ style: popoverStyle, placement })
  }
  render () {
    const { msg } = this.props
    const tooltip = this.props.tooltip || msg.clickForHelp()

    const popover = (
      <Popover id='popover-positioned-top' style={this.state.style} className={style['field-help-min-width']} title={this.props.title}>
        {this.props.content}
      </Popover>)

    const container = this.props.container === null ? undefined : this.props.container || this
    return (
      <OverlayTrigger trigger='click' rootClose placement={this.state.placement} overlay={popover} container={container}>
        <div role='button' title={tooltip} className={this.props.text && style['field-text']} style={{ position: 'relative' }}>
          {this.props.text}
          {this.props.children}
        </div>
      </OverlayTrigger>
    )
  }
}

FieldHelp.propTypes = {
  title: PropTypes.string, // popover title
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), // popover content
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), // decorated text
  tooltip: PropTypes.string, // tooltip shown when hovering the text
  children: PropTypes.any,
  container: PropTypes.any,
  msg: PropTypes.object.isRequired,
}

export default withMsg(FieldHelp)
