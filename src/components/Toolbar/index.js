import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Toolbar } from 'patternfly-react'
import style from './style.css'
import { RouterPropTypeShapes } from '_/propTypeShapes'
import VmActions from '../VmActions'
import VmConsoleSelector from '../VmConsole/VmConsoleSelector'
import VmConsoleInstructionsModal from '../VmConsole/VmConsoleInstructionsModal'
import VmsListToolbar from './VmsListToolbar'

import { NATIVE_VNC, SPICE } from '_/constants'

const VmDetailToolbar = ({ match, vms }) => {
  if (vms.getIn(['vms', match.params.id])) {
    const poolId = vms.getIn(['vms', match.params.id, 'pool', 'id'])
    const pool = vms.getIn(['pools', poolId])
    return (
      <Toolbar className={style['full-width']}>
        <Toolbar.RightContent>
          <VmActions vm={vms.getIn(['vms', match.params.id])} pool={pool} />
        </Toolbar.RightContent>
      </Toolbar>
    )
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

const VmConsoleToolbar = ({ match: { params: { id, consoleType } } = {}, vms }) => {
  if (vms.getIn(['vms', id])) {
    return (
      <div className={`${style['console-toolbar']} container-fluid`}>
        <div className={style['console-toolbar-actions']} style={{ marginRight: 'auto' }}>
          <VmConsoleSelector
            vmId={id}
            consoleType={consoleType}
            isConsolePage
          />
          <VmConsoleInstructionsModal
            disabled={![NATIVE_VNC, SPICE].includes(consoleType)}
          />
        </div>
        <div className={style['console-toolbar-actions']}>
          <div id='vm-console-toolbar-sendkeys' />
        </div>
      </div>
    )
  }
  return <div />
}

VmConsoleToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
  match: RouterPropTypeShapes.match.isRequired,
}

const VmConsoleToolbarConnected = connect(
  (state) => ({
    vms: state.vms,
  })
)(VmConsoleToolbar)

const SettingsToolbar = () => <div id='settings-toolbar' />

export {
  VmDetailToolbarConnected as VmDetailToolbar,
  VmConsoleToolbarConnected as VmConsoleToolbar,
  VmsListToolbar,
  SettingsToolbar,
}
