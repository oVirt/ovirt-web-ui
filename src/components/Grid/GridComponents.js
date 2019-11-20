import React from 'react'
import PropTypes from 'prop-types'

import styles from './style.css'

/*
 * Adapt flex-box based grid for the layout. It is much easier to work with
 * than bootstrap3/patternfly grids.
 */
const Grid = ({ children, id, className = '', style }) => {
  const cn = `${styles['grid-container']} ${className}`
  return <div className={cn} style={style} id={id}>{children}</div>
}
Grid.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
}

const Row = ({ children, id, className = '', style }) => {
  const cn = `${styles['grid-row']} ${className}`
  return <div className={cn} style={style} id={id}>{children}</div>
}
Row.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
}

const Col = ({
  children,
  id,
  className = '',
  style,
  cols = -1,
  offset = -1,
  content = 'expand',
  wrapExpand = false,
  ...props
}) => {
  const cn = `${styles['grid-column']} ${className}`

  if (cols === -1 && offset > 0) {
    cols = 12 - offset
  }
  const widthPercent = cols * 100 / 12
  const colStyle = cols <= 0
    ? {}
    : wrapExpand
      ? { flex: `1 0 ${widthPercent}%` }
      : {
        flex: `0 0 ${widthPercent}%`,
        maxWidth: `${widthPercent}%`,
      }
  const offsetStyle = offset < 1 ? {} : {
    marginLeft: `${offset * 100 / 12}%`,
  }

  return (
    <div
      column-content={content}
      className={cn}
      style={{ ...colStyle, ...offsetStyle, ...style }}
      id={id}
      {...props}
    >
      {children}
    </div>
  )
}
Col.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  cols: function (props, propName, componentName) {
    if (props.cols && (props.cols < 1 || props.cols > 12)) {
      return new Error(`Prop 'cols' of component '${componentName}' is not in valid range of 1 .. 12 `)
    }
  },
  offset: function (props, propName, componentName) {
    if (props.offset !== undefined) {
      const maxOffset = props.cols ? 12 - props.cols : 11
      if (props.offset < 1 || props.offset > maxOffset) {
        return new Error(`Prop 'offset' of component '${componentName}' is not in valid range of 1 .. ${maxOffset}`)
      }
    }
  },
  content: PropTypes.oneOf(['expand', 'auto']),
  wrapExpand: PropTypes.bool,
}

export {
  Grid,
  Row,
  Col,
}
