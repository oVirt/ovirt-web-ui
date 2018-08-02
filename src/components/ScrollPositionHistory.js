import React from 'react'
import PropTypes from 'prop-types'

import { loadFromSessionStorage, saveToSessionStorage } from '../storage'

class ScrollPositionHistory extends React.Component {
  componentDidMount () {
    const { uniquePrefix } = this.props

    const scrollTop = loadFromSessionStorage(`${uniquePrefix}-scroll-top`) || 0

    // So far, main browser's window is used for scrolling
    window.document.querySelector('#page-body').scrollTop = scrollTop
  }

  componentWillUnmount () {
    const { uniquePrefix } = this.props

    const scrollTop = window.document.querySelector('#page-body').scrollTop
    saveToSessionStorage(`${uniquePrefix}-scroll-top`, '' + scrollTop)
  }

  render () {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}
ScrollPositionHistory.propTypes = {
  uniquePrefix: PropTypes.string.isRequired,
  children: PropTypes.any,
}

export default ScrollPositionHistory
