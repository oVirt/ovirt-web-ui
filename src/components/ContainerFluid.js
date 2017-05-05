import React from 'react'
import PropTypes from 'prop-types'

export const ContainerFluid = ({ children }) => (
  <div className='container-fluid'>
    {children}
  </div>
)

ContainerFluid.propTypes = {
  children: PropTypes.node,
}

export default ContainerFluid
