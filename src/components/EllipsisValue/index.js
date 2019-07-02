import React from 'react'
import PropTypes from 'prop-types'
import style from './style.css'
import classnames from 'classnames'

class FieldValue extends React.Component {
  constructor (props) {
    super(props)
    this.ref = React.createRef()
    this.state = {
      isOverflow: false,
    }

    this.updateOverflow = this.updateOverflow.bind(this)
  }

  componentDidUpdate () {
    this.updateOverflow()
  }

  componentDidMount () {
    window.addEventListener('resize', this.updateOverflow)
    this.updateOverflow()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateOverflow)
  }

  updateOverflow () {
    if (!this.props.children) {
      return
    }

    const state = { isOverflow: false }
    if (this.ref.current.offsetWidth < this.ref.current.scrollWidth) {
      state.isOverflow = true
    }
    if (this.state.isOverflow !== state.isOverflow) {
      this.setState(state)
    }
  }

  render () {
    const { className, id, children, tooltip } = this.props

    if (children) {
      return <span
        className={classnames(style['field-value'], className)}
        id={id}
        title={this.state.isOverflow ? tooltip : ''}
        ref={this.ref}
      >
        {children}
      </span>
    } else {
      return null
    }
  }
}

FieldValue.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string,
  children: function (props, propName, componentName, ...rest) {
    if ((props.children && !props.tooltip) || (!props.children && props.tooltip)) {
      return new Error(`Props 'children' and 'tooltip' are both required for component ${componentName}`)
    }
    return PropTypes.oneOfType([ PropTypes.string, PropTypes.node ])(props, propName, componentName, ...rest)
  },
  tooltip: function (props, propName, componentName, ...rest) {
    if ((props.children && !props.tooltip) || (!props.children && props.tooltip)) {
      return new Error(`Props 'children' and 'tooltip' are both required for component ${componentName}`)
    }
    return PropTypes.string(props, propName, componentName, ...rest)
  },
}

export default FieldValue
