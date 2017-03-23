import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import { closeDetail } from '../actions'

import sharedStyle from './sharedStyle.css'

class DetailContainer extends Component {
  componentDidMount () {
    this.onKeyDown = (event) => {
      if (event.keyCode === 27) { // ESC
        this.props.onCloseDetail()
      }
    }

    window.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onKeyDown)
  }

  render () {
    const { children } = this.props
    return (
      <div className={'container-fluid ' + sharedStyle['move-left-detail']}>
        {children}
      </div>
    )
  }
}
DetailContainer.propTypes = {
  children: PropTypes.node,
  onCloseDetail: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
  }),
  (dispatch) => ({
    onCloseDetail: () => dispatch(closeDetail()),
  })
)(DetailContainer)
