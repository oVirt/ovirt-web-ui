import React from 'react'
import PropTypes from 'prop-types'

import { OverlayTrigger, Popover } from 'react-bootstrap'

/**
 * Renders small blue info icon.
 * Text (help) is displayed on click.
 */
const FieldHelp = ({
  title,
  content,
  tooltip = 'Click for help',
  }) => {
  const popover = (
    <Popover id='popover-positioned-top' title={title}>
      {content}
    </Popover>)

  return (
    <OverlayTrigger trigger='click' rootClose placement='top' overlay={popover}>
      <a role='button' title={tooltip}>
        <span className='fa fa-info-circle' />
      </a>
    </OverlayTrigger>
  )
}
FieldHelp.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  tooltip: PropTypes.string,
}

export default FieldHelp
