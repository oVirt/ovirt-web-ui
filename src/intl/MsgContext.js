import React from 'react'

// do not provide default value
// the real value will be provided by the root of the component tree
const MsgContext = React.createContext()
export const withMsg = (WrappedComponent) => {
  return ({ ...otherProps }) => (
    <MsgContext.Consumer>{({ ...msgProps }) => (
      <WrappedComponent {...otherProps} {...msgProps} />)
    }
    </MsgContext.Consumer>
  )
}

export default MsgContext
