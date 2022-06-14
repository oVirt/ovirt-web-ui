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
import VmsListToolbar from './VmsListToolbar'

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

const SettingsToolbar = () => <div id='settings-toolbar' />

export {
  VmDetailToolbarConnected as VmDetailToolbar,
  VmsListToolbar,
  SettingsToolbar,
}
