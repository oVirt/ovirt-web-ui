import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { RouterPropTypeShapes } from '_/propTypeShapes'
import VmActions from '../VmActions'
import { VmConsoleSelector } from '../Pages'
import VmConsoleSettingsModal from '../VmConsoleSettingsModal'

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

const VmConsoleToolbar = ({ match, vms }) => {
  if (vms.getIn(['vms', match.params.id])) {
    return <div><VmConsoleSelector vmId={match.params.id} id='console-selector' consoleId={match.params.console_id} />
      <VmConsoleSettingsModal vm={vms.getIn(['vms', match.params.id])} /></div>
  }
  return <div />
}

VmConsoleToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
  match: RouterPropTypeShapes.match.isRequired,
}

const VmConsoleToolbarConncted = connect(
  (state) => ({
    vms: state.vms,
  })
)(VmConsoleToolbar)

export {
  VmDetailToolbarConnected as VmDetailToolbar,
  PoolDetailToolbarConnected as PoolDetailToolbar,
  VmConsoleToolbarConncted as VmConsoleToolbar,
}
