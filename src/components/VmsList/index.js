import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import ContainerFluid from '../ContainerFluid'
import Vms from './Vms'
import LoadingData from '../LoadingData'

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

const VmsList = ({ vms, config, visibility }) => {
  const isDetailVisible = !!visibility.get('dialogToShow')

  if ((vms.get('vms') && !vms.get('vms').isEmpty()) || (vms.get('pools') && !vms.get('pools').isEmpty())) {
    return (
      <Vms />
    )
  } else if (!isDetailVisible) {
    if (vms.get('loadInProgress')) { // data load in progress
      return (
        <ContainerFluid>
          <LoadingData />
        </ContainerFluid>
      )
    } else { // No VM available
      return (
        <ContainerFluid>
          <NoVm />
        </ContainerFluid>
      )
    }
  }

  return null
}
VmsList.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default withRouter(connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
    visibility: state.visibility,
  })
)(VmsList))
