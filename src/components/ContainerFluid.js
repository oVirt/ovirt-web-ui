import React from 'react'
import PropTypes from 'prop-types'
import { Grid } from 'patternfly-react'

const ContainerFluid = ({ children }) => (<Grid fluid>{children}</Grid>)

ContainerFluid.propTypes = {
  children: PropTypes.node,
}

export default ContainerFluid
