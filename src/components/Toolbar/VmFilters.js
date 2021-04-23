import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Filter, FormControl } from 'patternfly-react'
import { enumMsg, withMsg } from '_/intl'
import { saveVmsFilters } from '_/actions'
import { localeCompare } from '_/helpers'

import style from './style.css'

class VmFilters extends React.Component {
  constructor (props) {
    super(props)

    this.composeFilterTypes = this.composeFilterTypes.bind(this)
    this.filterAdded = this.filterAdded.bind(this)
    this.selectFilterType = this.selectFilterType.bind(this)
    this.filterValueSelected = this.filterValueSelected.bind(this)
    this.updateCurrentValue = this.updateCurrentValue.bind(this)
    this.onValueKeyPress = this.onValueKeyPress.bind(this)
    this.filterExists = this.filterExists.bind(this)
    this.getFilterValue = this.getFilterValue.bind(this)
    this.renderInput = this.renderInput.bind(this)

    const filterTypes = this.composeFilterTypes()
    this.state = {
      currentFilterType: filterTypes[0],
      activeFilters: {},
      currentValue: '',
    }
  }

  composeFilterTypes () {
    const { msg, locale } = this.props
    const statuses = [
      'up',
      'powering_up',
      'down',
      'paused',
      'suspended',
      'powering_down',
      'not_responding',
      'unknown',
      'unassigned',
      'migrating',
      'wait_for_launch',
      'reboot_in_progress',
      'saving_state',
      'restoring_state',
      'image_locked',
    ]
    const filterTypes = [
      {
        id: 'name',
        title: msg.name(),
        placeholder: msg.vmFilterTypePlaceholderName(),
        filterType: 'text',
      },
      {
        id: 'status',
        title: msg.status(),
        placeholder: msg.vmFilterTypePlaceholderStatus(),
        filterType: 'select',
        filterValues: statuses
          .map((status) => ({ title: enumMsg('VmStatus', status, msg), id: status }))
          .sort((a, b) => localeCompare(a.title, b.title, locale)),
      },
      {
        id: 'os',
        title: msg.operatingSystem(),
        placeholder: msg.vmFilterTypePlaceholderOS(),
        filterType: 'select',
        filterValues: Array.from(this.props.operatingSystems
          .toList()
          .reduce((acc, item) => (
            acc.add(item.get('description'))
          ), new Set()))
          .map(item => ({ title: item, id: item }))
          .sort((a, b) => localeCompare(a.title, b.title, locale)),
      },
    ]
    return filterTypes
  }

  filterAdded (field, value) {
    let activeFilters = Object.assign({}, this.props.vms.get('filters').toJS())
    if ((field.filterType === 'select')) {
      activeFilters[field.id] = value.title
    } else {
      if (!activeFilters[field.id]) {
        activeFilters[field.id] = []
      }
      activeFilters[field.id].push(value)
    }
    this.props.onFilterUpdate(activeFilters)
  };

  selectFilterType (filterType) {
    const { currentFilterType } = this.state
    if (currentFilterType !== filterType) {
      let newCurrentValue = ''
      if (filterType.filterType === 'select') {
        if (this.filterExists(filterType.id)) {
          const filterValue = this.getFilterValue(filterType.id)
          newCurrentValue = filterValue
        }
      }
      this.setState({
        currentFilterType: filterType,
        currentValue: newCurrentValue,
      })
    }
  }

  filterValueSelected (filterValue) {
    const { currentFilterType, currentValue } = this.state

    if (filterValue !== currentValue) {
      this.setState({ currentValue: filterValue })
      if (filterValue) {
        this.filterAdded(currentFilterType, filterValue)
      }
    }
  }

  updateCurrentValue (event) {
    this.setState({ currentValue: event.target.value })
  }

  onValueKeyPress (keyEvent) {
    const { currentValue, currentFilterType } = this.state

    if (keyEvent.key === 'Enter' && currentValue && currentValue.length > 0) {
      this.setState({ currentValue: '' })
      this.filterAdded(currentFilterType, currentValue)
      keyEvent.stopPropagation()
      keyEvent.preventDefault()
    }
  }

  filterExists (fieldId) {
    return !!this.props.vms.getIn(['filters', fieldId])
  };

  getFilterValue (fieldId) {
    return this.props.vms.getIn(['filters', fieldId])
  };

  renderInput () {
    const { currentFilterType, currentValue, filterCategory } = this.state
    if (!currentFilterType) {
      return null
    }

    if (currentFilterType.filterType === 'select') {
      if (currentValue !== '' && !this.filterExists(currentFilterType.id)) {
        this.setState({
          currentValue: '',
          filterCategory,
        })
      }
      return (
        <Filter.ValueSelector
          filterValues={currentFilterType.filterValues}
          placeholder={currentFilterType.placeholder}
          currentValue={currentValue}
          onFilterValueSelected={this.filterValueSelected}
          className={style['selector-overflow']}
        />
      )
    }
    return (
      <FormControl
        type={currentFilterType.filterType}
        value={currentValue}
        placeholder={currentFilterType.placeholder}
        onChange={e => this.updateCurrentValue(e)}
        onKeyPress={e => this.onValueKeyPress(e)}
      />
    )
  }

  render () {
    const { currentFilterType } = this.state

    const filterTypes = this.composeFilterTypes()

    return (
      <Filter>
        <Filter.TypeSelector
          filterTypes={filterTypes}
          currentFilterType={currentFilterType}
          onFilterTypeSelected={this.selectFilterType}
        />
        {this.renderInput()}
      </Filter>
    )
  }
}

VmFilters.propTypes = {
  operatingSystems: PropTypes.object.isRequired,
  vms: PropTypes.object.isRequired,
  onFilterUpdate: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  (state) => ({
    operatingSystems: state.operatingSystems,
    vms: state.vms,
  }),
  (dispatch) => ({
    onFilterUpdate: (filters) => dispatch(saveVmsFilters({ filters })),
  })
)(withMsg(VmFilters))
