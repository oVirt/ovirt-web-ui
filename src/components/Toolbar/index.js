import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { useParams } from 'react-router-dom'

import {
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
} from '@patternfly/react-core'
import VmActions from '../VmActions'
import VmsListToolbar from './VmsListToolbar'

const VmDetailToolbar = ({ vms }) => {
  const { id: vmId } = useParams()

  if (vmId && vms.getIn(['vms', vmId])) {
    const poolId = vms.getIn(['vms', vmId, 'pool', 'id'])
    const pool = vms.getIn(['pools', poolId])
    return (
      <Toolbar className='portaled-toolbars-padding'>
        <ToolbarContent >
          <ToolbarGroup alignment={{ default: 'alignRight' }}>
            <VmActions vm={vms.getIn(['vms', vmId])} pool={pool} />
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
    )
  }
  return null
}

VmDetailToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
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
