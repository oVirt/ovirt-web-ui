import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import ContainerFluid from '../ContainerFluid'
import Vms from './Vms'
import { msg } from '../../intl'

/**
 * Component displayed when VMs or Pools exist but the data is still loading.
 */
const VmLoading = () => {
  return <div />
}

/**
 * Component displayed when no VMs or Pools could be loaded for the current user.
 */
const NoVmAvailable = () => {
  const idPrefix = 'no-vm'
  return (
    <ContainerFluid>
      <div className='blank-slate-pf'>
        <div className='blank-slate-pf-icon'>
          <span className='pficon pficon pficon-add-circle-o' id={`${idPrefix}-icon`} />
        </div>
        <h1 id={`${idPrefix}-title`}>
          {msg.noVmAvailable()}
        </h1>
        <p id={`${idPrefix}-text`}>
          {msg.noVmAvailableForLoggedUser()}
        </p>
      </div>
    </ContainerFluid>
  )
}

const VmsList = ({ vms }) => {
  const haveVms = (vms.get('vms') && !vms.get('vms').isEmpty())
  const havePools = (vms.get('pools') && !vms.get('pools').isEmpty())

  let el = null

  if (haveVms || havePools) {
    el = <Vms />
  } else if (vms.get('loadInProgress')) {
    el = <VmLoading />
  } else {
    el = <NoVmAvailable />
  }

  return el
}
VmsList.propTypes = {
  vms: PropTypes.object.isRequired,
}

export default withRouter(connect(
  (state) => ({
    vms: state.vms,
  })
)(VmsList))
