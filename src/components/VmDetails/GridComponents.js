import React from 'react'
import PropTypes from 'prop-types'

import styles from './style.css'

/*
 * Adapt flex-box based grid for the layout. It is much easier to work with
 * than bootstrap3/patternfly grids.
 */
const Grid = ({ className, children, ...props }) => {
  const cn = `${styles['grid-container']} ${!!className && className}`
  return <div className={cn} {...props}>{children}</div>
}
Grid.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

const Row = ({ className, children, ...props }) => {
  const cn = `${styles['grid-row']} ${!!className && className}`
  return <div className={cn} {...props}>{children}</div>
}
Row.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

const Col = ({ className, cols = -1, style, children, ...props }) => {
  const cn = `${styles['grid-column']} ${!!className && className}`
  const widthPercent = cols * 100 / 12
  const col = cols <= 0 ? {} : {
    flex: `0 0 ${widthPercent}%`,
    maxWidth: `${widthPercent}%`,
  }
  return (
    <div
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
}

export {
  Grid,
  Row,
  Col,
}
