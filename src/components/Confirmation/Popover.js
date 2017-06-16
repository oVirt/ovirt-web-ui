import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'

class Popover extends React.Component {
  constructor (props) {
    super(props)
    this.state = { target: null, top: 0, left: 0, arrowLeft: 0 }
  }

  componentDidMount () {
    const el = ReactDOM.findDOMNode(this.props.target)
    if (el) {
      let left = 0
      let top = 0
      const rect = el.getBoundingClientRect()
      const windowWidth = window.innerWidth
      let arrowLeft = this.props.width / 2
      if (this.props.placement === 'top' || this.props.placement === 'bottom') {
        left = this.props.width / 2 * -1
        const offset = (left + rect.left + this.props.width + (rect.width / 2)) - windowWidth
        if (offset > 0) {
          arrowLeft += offset
          left -= offset
        }
      }
      if (this.props.placement === 'top') {
        top = (el.clientHeight + this.props.height) * -1
      }
      this.setState({ top: top, left: left, target: el, arrowLeft: arrowLeft })
    }
  }
  render () {
    let { show, placement, width, height, children } = this.props
    let display = show ? 'block' : 'none'
    if (this.state.target && show) {
      return (
        <div style={{ position: 'relative', left: '50%' }}>
          <div className={`popover fade ${placement} in`} role='tooltip' style={{ position: 'absolute', display: display, width: width + 'px', left: this.state.left + 'px', top: this.state.top + 'px', minHeight: height + 'px' }}>
            <div className='arrow' style={{ left: this.state.arrowLeft + 'px' }} />
            <div className='popover-content'>
              {children}
            </div>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

Popover.propTypes = {
  show: PropTypes.bool,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  target: PropTypes.object.isRequired,
  placement: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
}

export default Popover
