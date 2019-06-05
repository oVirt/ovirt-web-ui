import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import style from './style.css'
import { RouterPropTypeShapes } from '_/propTypeShapes'
import VmActions from '../VmActions'
import VmConsoleSelector from '../VmConsole/VmConsoleSelector'
import VmConsoleInstructionsModal from '../VmConsole/VmConsoleInstructionsModal'

import { INIT_CONSOLE, DOWNLOAD_CONSOLE } from '_/constants'

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

const VmConsoleToolbar = ({ match, vms, consoles }) => {
  if (vms.getIn(['vms', match.params.id])) {
    const consoleStatus = [INIT_CONSOLE, DOWNLOAD_CONSOLE]
    return <div className={style['console-toolbar']}>
      <div className={style['console-toolbar-actions']}>
        <VmConsoleSelector
          vmId={match.params.id}
          consoleId={match.params.console}
          isConsolePage
        />
        <VmConsoleInstructionsModal
          disabled={!consoleStatus.includes(consoles.getIn(['vms', match.params.id, 'consoleStatus']))} />
      </div>
      <div className={style['console-toolbar-actions']}>
        <div id='vm-console-toolbar-sendkeys' />
      </div>
    </div>
  }
  return <div />
}

VmConsoleToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
  consoles: PropTypes.object.isRequired,
  match: RouterPropTypeShapes.match.isRequired,
}

const VmConsoleToolbarConnected = connect(
  (state) => ({
    vms: state.vms,
    consoles: state.consoles,
  })
)(VmConsoleToolbar)

export {
  VmDetailToolbarConnected as VmDetailToolbar,
  PoolDetailToolbarConnected as PoolDetailToolbar,
  VmConsoleToolbarConnected as VmConsoleToolbar,
}
