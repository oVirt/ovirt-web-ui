import React from 'react'
import PropTypes from 'prop-types'

import styles from './style.css'

/*
 * Adapt flex-box based grid for the layout. It is much easier to work with
 * than bootstrap3/patternfly grids.
 */
const Grid = ({ className = '', children, style, ...props }) => {
  const cn = `${styles['grid-container']} ${className}`
  return <div className={cn} style={style}>{children}</div>
}
Grid.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
}

const Row = ({ className = '', children, style, id }) => {
  const cn = `${styles['grid-row']} ${className}`
  return <div className={cn} style={style} id={id}>{children}</div>
}
Row.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
}

const Col = ({ className = '', cols = -1, style, children, content = 'expand', ...props }) => {
  const cn = `${styles['grid-column']} ${className}`
  const widthPercent = cols * 100 / 12
  const col = cols <= 0 ? {} : {
    flex: `0 0 ${widthPercent}%`,
    maxWidth: `${widthPercent}%`,
  }
  return (
    <div
      column-content={content}
      className={cn}
      style={{ ...col, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
Col.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  cols: PropTypes.number,
  style: PropTypes.object,
  content: PropTypes.oneOf(['expand', 'auto']),
}

export {
  Grid,
  Row,
  Col,
}
