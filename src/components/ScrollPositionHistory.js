import React from 'react'
import PropTypes from 'prop-types'

import { loadFromSessionStorage, saveToSessionStorage } from '../storage'

/*
 * NOTE: On a page reload, if the scroll position was quite high (the user scrolled
 *       down quite far), that scroll position will not be available until multiple
 *       pages of VMs are loaded.  So instead the user will be scrolled to the place
 *       where the last current loaded VM is rendered.
 */
class ScrollPositionHistory extends React.Component {
  componentDidMount () {
    const { uniquePrefix, scrollContainerSelector } = this.props

    const scrollTop = loadFromSessionStorage(`${uniquePrefix}-scroll-top`) || 0
    window.document.querySelector(scrollContainerSelector).scrollTop = scrollTop
  }

  componentWillUnmount () {
    const { uniquePrefix, scrollContainerSelector } = this.props

    const scrollTop = window.document.querySelector(scrollContainerSelector).scrollTop
    saveToSessionStorage(`${uniquePrefix}-scroll-top`, '' + scrollTop)
  }

  render () {
    return (
      <>
        {this.props.children}
      </>
    )
  }
}
ScrollPositionHistory.propTypes = {
  scrollContainerSelector: PropTypes.string.isRequired,
  uniquePrefix: PropTypes.string.isRequired,
  children: PropTypes.any,
}

export default ScrollPositionHistory
