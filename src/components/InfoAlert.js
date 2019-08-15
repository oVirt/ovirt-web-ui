import React from 'react'
import sharedStyle from './sharedStyle.css'

class InfoAlert extends React.Component {
  render () {
    return (
      <p className={`alert alert-info alert-dismissable ${sharedStyle['toast-console-message']}`}>
        <button type='button' className='close' data-dismiss='alert' aria-label='Close'>
          <span className='pficon pficon-close' />
        </button>
        <span className='pficon pficon-info' />
        <strong>Press F11 to exit full screen mode</strong>
      </p>
    )
  }
}

export default InfoAlert
