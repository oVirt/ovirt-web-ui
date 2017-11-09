import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { closeDialog } from '../actions'
// import { closeAllConfirmationComponents } from './Confirmation'

import sharedStyle from './sharedStyle.css'

class DetailContainer extends Component {
  componentDidMount () {
    this.onKeyDown = (event) => {
      if (event.keyCode === 27) { // ESC
//        closeAllConfirmationComponents()
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
      <div className={`container-fluid ${sharedStyle['move-left-detail']} ${sharedStyle['detail-z-index']}`}>
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
    onCloseDetail: () => dispatch(closeDialog({ force: false })),
  })
)(DetailContainer)
