import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
} from '@patternfly/react-core'
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
      <Toolbar className='portaled-toolbars-padding'>
        <ToolbarContent >
          <ToolbarGroup alignment={{ default: 'alignRight' }}>
            <VmActions vm={vms.getIn(['vms', match.params.id])} pool={pool} />
          </ToolbarGroup>
        </ToolbarContent>
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
  if (!vms.getIn(['vms', id])) {
    return <Toolbar/>
  }

  return (
    <Toolbar className='portaled-toolbars-padding'>
      <ToolbarContent >
        <ToolbarGroup variant="button-group">
          <VmConsoleSelector
            vmId={id}
            consoleType={consoleType}
            isConsolePage
          />
          <VmConsoleInstructionsModal
            disabled={![NATIVE_VNC, SPICE].includes(consoleType)}
          />
        </ToolbarGroup>
        <ToolbarGroup variant="button-group" alignment={{ default: 'alignRight' }}>
          <div id='vm-console-toolbar-sendkeys' />
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  )
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
