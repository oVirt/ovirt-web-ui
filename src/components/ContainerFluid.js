import React, { PropTypes } from 'react'

export const ContainerFluid = ({ children }) => (
  <div className='container-fluid'>
    {children}
  </div>
)

ContainerFluid.propTypes = {
  children: PropTypes.node,
}

export default ContainerFluid
