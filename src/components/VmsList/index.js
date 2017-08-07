import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import ContainerFluid from '../ContainerFluid'
import Vms from './Vms'
import { msg } from '../../intl'

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
        {msg.noVmAvailable()}
      </h1>
      <p>
        {msg.noVmAvailableForLoggedUser()}
      </p>
    </div>
  )
}

const VmsList = ({ vms, visibility }) => {
  const isDetailVisible = !!visibility.get('dialogToShow')

  if ((vms.get('vms') && !vms.get('vms').isEmpty()) || (vms.get('pools') && !vms.get('pools').isEmpty())) {
    return (
      <Vms />
    )
  } else if (!isDetailVisible) {
    if (vms.get('loadInProgress')) {
      return <div /> // "Loading Data ..." message rendered elsewhere
    } else { // No VM available and initial data load is finished
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
  visibility: PropTypes.object.isRequired,
}

export default withRouter(connect(
  (state) => ({
    vms: state.vms,
    visibility: state.visibility,
  })
)(VmsList))
