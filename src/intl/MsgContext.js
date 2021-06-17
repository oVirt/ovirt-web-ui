import React from 'react'

// do not provide default value
// the real value will be provided by the root of the component tree
const MsgContext = React.createContext()
export const withMsg = (WrappedComponent) => {
  return ({ ...otherProps }) => (
    <MsgContext.Consumer>{({ ...msgProps } = {}) => (
      // allow overwritting context-based props
      // main use case: context not available due to bug
      // https://github.com/react-bootstrap/react-bootstrap/issues/5016
      <WrappedComponent {...msgProps} {...otherProps} />)
    }
    </MsgContext.Consumer>
  )
}

export default MsgContext
