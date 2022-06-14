import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { RouterPropTypeShapes } from '_/propTypeShapes'
import VmActions from '../VmActions'
import VmsListToolbar from './VmsListToolbar'
import {
  SEVERITY,
  DATE,
  MESSAGE,
  filterEvents,
  EventFilters,
  EventSort,
} from '../Events'
import { saveEventFilters } from '_/actions'
import { withMsg } from '_/intl'
import { toJS } from '_/helpers'

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

const EventsToolbar = ({
  events,
  eventFilters: { [SEVERITY]: severityFilters, [DATE]: dateFilters, [MESSAGE]: messageFilters },
  msg,
  onClearFilters,
}) => {
  if (!events) {
    return null
  }
  const total = events?.length ?? 0
  const hasFilters = severityFilters?.length || dateFilters?.length || messageFilters?.length
  const filteredEvents = filterEvents({ events, severityFilters, dateFilters, messageFilters })
  return (
    <Toolbar className='portaled-toolbars-padding' clearAllFilters={onClearFilters}>
      <ToolbarContent >
        <EventFilters/>
        <EventSort />
        <ToolbarItem>
          <h5>
            { hasFilters
              ? msg.resultsOf({ total, available: filteredEvents?.length ?? 0 })
              : msg.results({ total })
            }
          </h5>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  )
}

EventsToolbar.propTypes = {
  events: PropTypes.array,
  eventFilters: PropTypes.object.isRequired,
  msg: PropTypes.object.isRequired,

  onClearFilters: PropTypes.func.isRequired,
}

const EventsToolbarConnected = connect(
  ({ userMessages }, { match }) => ({
    events: toJS(userMessages.getIn(['events', match?.params?.id])),
    eventFilters: toJS(userMessages.getIn(['eventFilters'], {})),
  }),
  (dispatch) => ({
    onClearFilters: () => dispatch(saveEventFilters({ filters: {} })),
  })
)(withMsg(EventsToolbar))

const SettingsToolbar = () => <div id='settings-toolbar' />

export {
  VmDetailToolbarConnected as VmDetailToolbar,
  EventsToolbarConnected as EventsToolbar,
  VmsListToolbar,
  SettingsToolbar,
}

export { default as Sort } from './Sort'
export { default as Filters } from './Filters'
