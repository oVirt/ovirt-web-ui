import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import ContainerFluid from '../ContainerFluid'
import Vms from './Vms'

/**
 * Data are fetched but no VM is available to display
 */
const NoVm = () => {
  return (
    <div className='blank-slate-pf'>
      <div className='blank-slate-pf-icon'>
        <span className='pficon pficon pficon-add-circle-o' />
      </div>
      <h1>
        No VM available
      </h1>
      <p>
        No VM is available for the logged user.
      </p>
    </div>
  )
}

/**
 * Login (token) to Engine is missing.
 */
const NoLogin = () => {
  return (
    <div className='blank-slate-pf'>
      <div className='blank-slate-pf-icon'>
        <span className='pficon pficon pficon-user' />
      </div>
      <h1>
        Please log in ...
      </h1>
    </div>
  )
}

const VmsList = ({ vms, config, visibility }) => {
  const isDetailVisible = !!visibility.get('dialogToShow')
  const loadInProgress = !!vms.get('loadInProgress')

  if (vms.get('vms') && !vms.get('vms').isEmpty()) {
    return (
      <Vms />
    )
  } else if (!config.get('loginToken')) { // login is missing
    return (
      <ContainerFluid>
        <NoLogin />
      </ContainerFluid>
    )
  } else if (!isDetailVisible && !loadInProgress) { // No VM available
    return (
      <ContainerFluid>
        <NoVm />
      </ContainerFluid>
    )
  }

  return null
}
VmsList.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
    visibility: state.visibility,
  })
)(VmsList)
