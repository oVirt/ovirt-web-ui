import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { RouterPropTypeShapes } from '../../propTypeShapes'
import VmActions from '../VmActions'

const VmDetailToolbar = ({ match, vms }) => {
  if (vms.getIn(['vms', match.params.id])) {
    return (<VmActions vm={vms.getIn(['vms', match.params.id])} />)
  }
  return null
}

VmDetailToolbar.propTypes = {
  vms: PropTypes.object.isRequired,

  match: RouterPropTypeShapes.match.isRequired,
}

const VmDetailToolbarConnected = connect(
  (state) => ({
    vms: state.vms,
  })
)(VmDetailToolbar)

const PoolDetailToolbar = ({ match, vms }) => {
  if (vms.getIn(['pools', match.params.id])) {
    return (<VmActions vm={vms.getIn(['pools', match.params.id, 'vm'])} key='vmaction' pool={vms.getIn(['pools', match.params.id])} />)
  }
  return null
}

PoolDetailToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
  match: RouterPropTypeShapes.match.isRequired,
}

const PoolDetailToolbarConnected = connect(
  (state) => ({
    vms: state.vms,
  })
)(PoolDetailToolbar)

export {
  VmDetailToolbarConnected as VmDetailToolbar,
  PoolDetailToolbarConnected as PoolDetailToolbar,
}
