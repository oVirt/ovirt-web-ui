import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import VmActions from '../VmActions'

const VmDetailToolbar = ({ match, vms }) => {
  if (vms.getIn(['vms', match.params.id])) {
    return (<VmActions vm={vms.getIn(['vms', match.params.id])} />)
  }
  return null
}

VmDetailToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
}

const VmDetailToolbarConnected = connect(
  (state) => ({
    vms: state.vms,
  })
)(VmDetailToolbar)

const PoolDetailToolbar = ({ match, vms }) => {
  if (vms.getIn(['pools', match.params.id])) {
    return (<VmActions vm={vms.getIn(['pools', match.params.id, 'vm'])} key='vmaction' pool={vms.getIn(['pools', match.params.id])} isPool />)
  }
  return null
}

PoolDetailToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
}

const PoolDetailToolbarConnected = connect(
  (state) => ({
    vms: state.vms,
  })
)(PoolDetailToolbar)

export { VmDetailToolbarConnected as VmDetailToolbar, PoolDetailToolbarConnected as PoolDetailToolbar }
