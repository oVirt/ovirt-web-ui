import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { enumMsg, withMsg } from '_/intl'
import { saveVmsFilters } from '_/actions'
import { localeCompare, toJS } from '_/helpers'

import Filters from './Filters'

const STATUS = 'status'
const OS = 'os'
const NAME = 'name'

const composeStatus = (msg, locale) => {
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
  return {
    id: STATUS,
    title: msg.status(),
    placeholder: msg.vmFilterTypePlaceholderStatus(),
    filterValues: Object.entries(statuses
      .map((status) => ({ title: enumMsg('VmStatus', status, msg), id: status }))
      .reduce((acc, { title, id }) => {
        acc[title] = { ...acc[title], [id]: id }
        return acc
      }, {}))
      .map(([title, ids]) => ({ title, ids }))
      .sort((a, b) => localeCompare(a.title, b.title, locale)),
  }
}

const composeOs = (msg, locale, operatingSystems) => {
  return ({
    id: OS,
    title: msg.operatingSystem(),
    placeholder: msg.vmFilterTypePlaceholderOS(),
    filterValues: Object.entries(operatingSystems
      .toList().toJS()
    // { name: 'other_linux_ppc64', description: 'Linux'},  {description: 'Linux', name: 'other_linux'}
    // {title: 'Linux', ids: {'other_linux_ppc64', 'other_linux'}
      .reduce((acc, { name, description }) => {
        acc[description] = { ...acc[description], [name]: name }
        return acc
      }, {}))
      .map(([description, ids]) => ({ title: description, ids }))
      .sort((a, b) => localeCompare(a.title, b.title, locale)),
  })
}

const VmFilters = ({ msg, locale, operatingSystems, selectedFilters, onFilterUpdate }) => {
  const filterTypes = useMemo(() => [
    {
      id: NAME,
      title: msg.name(),
      placeholder: msg.vmFilterTypePlaceholderName(),
    },
    composeStatus(msg, locale),
    composeOs(msg, locale, operatingSystems),
  ], [msg, locale, operatingSystems])
  return (
    <Filters
      selectedFilters={selectedFilters}
      onFilterUpdate={onFilterUpdate}
      filterTypes={filterTypes}
      textBasedFilterId={NAME}
    />
  )
}

VmFilters.propTypes = {
  operatingSystems: PropTypes.object.isRequired,
  selectedFilters: PropTypes.object.isRequired,
  onFilterUpdate: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  ({ operatingSystems, vms }) => ({
    operatingSystems,
    selectedFilters: toJS(vms.get('filters')),
  }),
  (dispatch) => ({
    onFilterUpdate: (filters) => dispatch(saveVmsFilters({ filters })),
  })
)(withMsg(VmFilters))
