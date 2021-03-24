import React from 'react'
import { msg } from './index'

const defaultMsg = { msg }
const MsgContext = React.createContext(defaultMsg)
console.warn('Created MsgContext:', MsgContext)

export const withMsg = (WrappedComponent) => {
  return ({ ...otherProps }) => (
    <MsgContext.Consumer>{({ ...msgProps }) => (
      <WrappedComponent {...otherProps} {...msgProps} />)
    }
    </MsgContext.Consumer>
  )
}

export default MsgContext
