import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { List } from 'immutable'
import { connect } from 'react-redux'

import { saveVmsFilters } from '_/actions'
import { MsgContext } from '_/intl'
import { RouterPropTypeShapes } from '_/propTypeShapes'
import { filterVms, mapFilterValues } from '_/utils'

import { Toolbar, Filter } from 'patternfly-react'
import { AddVmButton } from '_/components/CreateVmWizard'
import VmFilter from './VmFilters'
import VmSort from './VmSort'
import style from './style.css'

const VmsListToolbar = ({ match, vms, onRemoveFilter, onClearFilters }) => {
  const { msg } = useContext(MsgContext)
  const filters = vms.get('filters').toJS()

  const removeFilter = (filter) => {
    let filters = vms.get('filters')
    const filterValue = filters.get(filter.id)
    if (filterValue) {
      if (List.isList(filterValue)) {
        filters = filters.update(filter.id, (v) => v.delete(v.findIndex(v2 => filter.value === v2)))
        if (filters.get(filter.id).size === 0) {
          filters = filters.delete(filter.id)
        }
      } else {
        filters = filters.delete(filter.id)
      }
      onRemoveFilter(filters.toJS())
    }
  }

  const mapLabels = (item, index) => {
    const labels = []
    if (List.isList(item)) {
      item.forEach((t, i) => {
        labels.push(<Filter.Item
          key={i}
          onRemove={removeFilter}
          filterData={{ value: t, id: index }}
        >
          {msg[index]()}: {mapFilterValues[index](t)}
        </Filter.Item>)
      })
    } else {
      labels.push(<Filter.Item
        key={index}
        onRemove={removeFilter}
        filterData={{ value: item, id: index }}
      >
        {msg[index]()}: {mapFilterValues[index](item)}
      </Filter.Item>)
    }
    return labels
  }

  const total = vms.get('vms').size + vms.get('pools').size
  const available = vms.get('filters').size &&
    vms.get('vms').filter(vm => filterVms(vm, filters, msg)).size +
    vms.get('pools').filter(vm => filterVms(vm, filters, msg)).size

  return (
    <Toolbar className={style['full-width']}>
      <VmFilter />
      <VmSort />
      <Toolbar.RightContent>
        <AddVmButton key='addbutton' id='route-add-vm' />
      </Toolbar.RightContent>
      <Toolbar.Results>
        <h5>
          {
            vms.get('filters').size
              ? msg.resultsOf({ total, available })
              : msg.results({ total })
          }
        </h5>
        { vms.get('filters').size > 0 &&
          <React.Fragment>
            <Filter.ActiveLabel>{msg.activeFilters()}</Filter.ActiveLabel>
            <Filter.List>
              {[].concat(...vms.get('filters').map(mapLabels).toList().toJS())}
            </Filter.List>
            <a
              href='#'
              onClick={e => {
                e.preventDefault()
                onClearFilters()
              }}
            >
              {msg.clearAllFilters()}
            </a>
          </React.Fragment>
        }
      </Toolbar.Results>
    </Toolbar>)
}

VmsListToolbar.propTypes = {
  vms: PropTypes.object.isRequired,

  match: RouterPropTypeShapes.match.isRequired,
  onRemoveFilter: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
    onRemoveFilter: (filters) => dispatch(saveVmsFilters({ filters })),
    onClearFilters: () => dispatch(saveVmsFilters({ filters: {} })),
  })
)(VmsListToolbar)
