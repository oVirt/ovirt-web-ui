import React from 'react'
import PropTypes from 'prop-types'

import { OverlayTrigger, Popover } from 'react-bootstrap'

import style from './style.css'

/**
 * Renders small blue info icon.
 * Text (help) is displayed on click.
 */
const FieldHelp = ({
  title, // help title
  content, // help content
  text, // field description
  tooltip = 'Click for help',
  children,
  }) => {
  const popover = (
    <Popover id='popover-positioned-top' title={title}>
      {content}
    </Popover>)

  return (
    <OverlayTrigger trigger='click' rootClose placement='top' overlay={popover}>
      <div role='button' title={tooltip} className={text && style['field-text']}>
        {text}
        {children}
      </div>
    </OverlayTrigger>
  )
}
FieldHelp.propTypes = {
  title: PropTypes.string,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  tooltip: PropTypes.string,
  children: PropTypes.any,
}

export default FieldHelp
