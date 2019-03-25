import React from 'react'
import PropTypes from 'prop-types'
import style from './style.css'

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

  updateOverflow () {
    const state = { isOverflow: false }
    if (this.ref.current.offsetWidth < this.ref.current.scrollWidth) {
      state.isOverflow = true
    }
    if (this.state.isOverflow !== state.isOverflow) {
      this.setState(state)
    }
  }

  componentDidMount () {
    window.addEventListener('resize', this.updateOverflow)
    this.updateOverflow()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateOverflow)
  }
  render () {
    const { children, tooltip } = this.props
    return <span className={style['field-value']} title={this.state.isOverflow ? tooltip : ''} ref={this.ref}>
      {children}
    </span>
  }
}

FieldValue.propTypes = {
  children: PropTypes.oneOfType([ PropTypes.string, PropTypes.node ]).isRequired,
  tooltip: PropTypes.string.isRequired,
}

export default FieldValue
