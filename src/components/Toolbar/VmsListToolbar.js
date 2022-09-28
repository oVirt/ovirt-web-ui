import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { saveVmsFilters, saveRemoteOptionSilently } from '_/actions'
import { withMsg } from '_/intl'
import { RouterPropTypeShapes } from '_/propTypeShapes'
import { filterVms } from '_/utils'

import {
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
  Tooltip,
} from '@patternfly/react-core'
import { AddVmButton } from '_/components/CreateVmWizard'
import VmFilters from './VmFilters'
import VmSort from './VmSort'
import {
  TableIcon,
  ThLargeIcon,
} from '@patternfly/react-icons/dist/esm/icons'

import { toJS } from '_/helpers'

const VmsListToolbar = ({
  match,
  vms,
  pools,
  filters = {},
  onClearFilters,
  msg,
  enableTableView,
  disableTableView,
  tableView,
  hasMoreItems,
}) => {
  const { name, status, os } = filters
  const hasFilters = name?.length || status?.length || os?.length

  const total = vms.size + pools.size
  const available = vms.filter(vm => filterVms(vm, filters)).size +
    pools.filter(vm => filterVms(vm, filters)).size

  return (
    <>
      <Toolbar className='portaled-toolbars-padding' clearAllFilters={onClearFilters}>
        <ToolbarContent>
          <VmFilters/>
          <VmSort />
          <ToolbarItem>
            {
            /* integration tests (OST) expect VM count under xpath //div[@class='col-sm-12']/h5
            preserve this path:
            keep the class 'col-sm-12' as marker class
            keep the structure <div> followed by <h5> */
            }
            <div className='col-sm-12'>
              <h5>
                {
            hasMoreItems
              ? msg.resultsOfUnknownTotal({ available })
              : hasFilters
                ? msg.resultsOf({ total, available })
                : msg.results({ total })
          }
              </h5>
            </div>
          </ToolbarItem>
          <ToolbarItem alignment={{ default: 'alignRight' }}>
            <AddVmButton key='addbutton' id='route-add-vm' />
          </ToolbarItem>
          <ToolbarItem variant='separator'/>
          <ToolbarItem>
            <ToggleGroup aria-label={msg.toggleViewForVirtualMachines()}>
              <Tooltip content={msg.cardView()}>
                <ToggleGroupItem
                  icon={<ThLargeIcon />}
                  aria-label={msg.cardView()}
                  buttonId="cardView"
                  isSelected={!tableView}
                  onChange={disableTableView}
                />
              </Tooltip>
              <Tooltip content={msg.tableView()}>
                <ToggleGroupItem
                  icon={<TableIcon />}
                  aria-label={msg.tableView()}
                  buttonId="tableView"
                  isSelected={tableView}
                  onChange={enableTableView}
                />
              </Tooltip>
            </ToggleGroup>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </>
  )
}

VmsListToolbar.propTypes = {
  vms: PropTypes.object.isRequired,
  pools: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  tableView: PropTypes.bool.isRequired,
  hasMoreItems: PropTypes.bool.isRequired,

  match: RouterPropTypeShapes.match.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  disableTableView: PropTypes.func.isRequired,
  enableTableView: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  ({ vms, options }) => ({
    vms: vms.get('vms'),
    pools: vms.get('pools'),
    filters: toJS(vms.get('filters')),
    tableView: options.getIn(['remoteOptions', 'viewForVirtualMachines', 'content']) === 'table',
    hasMoreItems: vms.get('vmsExpectMorePages') || vms.get('poolsExpectMorePages'),
  }),

  (dispatch) => ({
    onClearFilters: () => dispatch(saveVmsFilters({ filters: {} })),
    enableTableView: () => dispatch(saveRemoteOptionSilently({ name: 'viewForVirtualMachines', value: 'table' })),
    disableTableView: () => dispatch(saveRemoteOptionSilently({ name: 'viewForVirtualMachines', value: 'card' })),
  })
)(withMsg(VmsListToolbar))
