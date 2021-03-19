import React from 'react'
import { msgObj } from './index'

const MsgContext = React.createContext(msgObj)
console.warn('Created MsgContext:', MsgContext)

export const withMsg = (WrappedComponent) => {
  return ({ ...otherProps }) => (
    <MsgContext.Consumer>{({ msg }) => (
      <WrappedComponent msg={msg} {...otherProps} />)
    }
    </MsgContext.Consumer>
  )
}

export default MsgContext
