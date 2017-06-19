import React from 'react'
import PropTypes from 'prop-types'

import { loadFromSessionStorage, saveToSessionStorage } from '../storage'
import { logDebug } from '../helpers'

class ScrollPositionHistory extends React.Component {
  componentDidMount () {
    const { uniquePrefix } = this.props

    const scrollTop = loadFromSessionStorage(`${uniquePrefix}-scroll-top`) || 0
    logDebug('ScrollPositionHistory.componentDidMount, restoring scrollTop: ', scrollTop)

    // So far, main browser's window is used for scrolling
    window.document.body.scrollTop = scrollTop
  }

  componentWillUnmount () {
    const { uniquePrefix } = this.props

    const scrollTop = window.document.body.scrollTop
    logDebug('ScrollPositionHistory.componentWillUnmount, saving scrollTop: ', scrollTop)
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
