import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

import VmDetail from '../VmDetail'
import VmDialog from '../VmDialog'
import VmsList from '../VmsList'

import { selectVmDetail, selectPoolDetail, getISOStorages } from '../../actions'
import Selectors from '../../selectors'

/**
 * Route component (for PageRouter) to view the list of VMs and Pools
 */
const VmsPage = () => {
  return <VmsList />
}

/**
 * Route component (for PageRouter) to view a VM's details
 */
class VmDetailPage extends React.Component {
  constructor (props) {
    super(props)
    this.requestSent = false
  }

  componentWillMount () {
    if (Selectors.isFilterChecked()) {
      this.props.getVms({ vmId: this.props.match.params.id })
    }
  }

  componentWillUpdate () {
    const vmInStore = this.props.vms.getIn(['vms', this.props.match.params.id])
    if (!vmInStore && Selectors.isFilterChecked() && !this.requestSent) {
      this.requestSent = true
      this.props.getVms({ vmId: this.props.match.params.id })
    }
  }

  render () {
    let { match, vms, config } = this.props
    if (vms.getIn(['vms', match.params.id])) {
      return (<VmDetail vm={vms.getIn(['vms', match.params.id])} config={config} />)
    } else if (vms.get('loadInProgress')) {
      console.info(`VmDetailPage: VM id cannot be found: ${match.params.id}. Load is still in progress - waiting before redirect`)
      return null
    }

    console.info(`VmDetailPage: VM id cannot be found: ${match.params.id}. Redirecting to / `)
    return <Redirect to='/' />
  }
}
VmDetailPage.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,

  match: PropTypes.object.isRequired,

  getVms: PropTypes.func.isRequired,
}
const VmDetailPageConnected = connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
  }),
  (dispatch) => ({
    getVms: ({ vmId }) => dispatch(selectVmDetail({ vmId })),
  })
)(VmDetailPage)

/**
 * Route component (for PageRouter) to view a Pool's details
 */
class PoolDetailPage extends React.Component {
  constructor (props) {
    super(props)
    this.requestSent = false
  }

  componentWillMount () {
    if (Selectors.isFilterChecked()) {
      this.props.getPools({ poolId: this.props.match.params.id })
    }
  }

  componentWillUpdate () {
    const poolInStore = this.props.vms.getIn(['pools', this.props.match.params.id, 'vm'])
    if (!poolInStore && Selectors.isFilterChecked() && !this.requestSent) {
      this.requestSent = true
      this.props.getPools({ poolId: this.props.match.params.id })
    }
  }

  render () {
    let { match, vms, config } = this.props

    if (vms.getIn(['pools', match.params.id, 'vm'])) {
      return (<VmDetail vm={vms.getIn(['pools', match.params.id, 'vm'])} pool={vms.getIn(['pools', match.params.id])} config={config} isPool />)
    } else if (vms.get('loadInProgress')) {
      return null
    }
    return <Redirect to='/' />
  }
}
PoolDetailPage.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,

  match: PropTypes.object.isRequired,

  getPools: PropTypes.func.isRequired,
}
const PoolDetailPageConnected = connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
  }),
  (dispatch) => ({
    getPools: ({ poolId }) => dispatch(selectPoolDetail({ poolId })),
  })
)(PoolDetailPage)

/**
 * Route component (for PageRouter) to edit a VM
 */
class VmDialogPage extends React.Component {
  componentWillMount () {
    this.props.getCDRom()

    // in case the location is entered from outside, refresh data
    if (this.props.match.params.id) {
      this.props.getVms({ vmId: this.props.match.params.id })
    }
  }

  render () {
    let { match, vms, previousPath } = this.props
    if ((match.params.id && vms.getIn(['vms', match.params.id])) || !match.params.id) {
      return (<VmDialog vm={vms.getIn(['vms', match.params.id])} previousPath={previousPath} />)
    } else if (vms.get('loadInProgress')) {
      console.info(`VmDialogPage: VM id cannot be found: ${match.params.id}. Load is still in progress - waiting before redirect`)
      return null
    }

    console.info(`VmDialogPage: VM id cannot be found: ${match.params.id}.`)
    return null
  }
}
VmDialogPage.propTypes = {
  vms: PropTypes.object.isRequired,

  match: PropTypes.object.isRequired,
  previousPath: PropTypes.string.isRequired,

  getCDRom: PropTypes.func.isRequired,
  getVms: PropTypes.func.isRequired,
}
const VmDialogPageConnected = connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
    getCDRom: () => dispatch(getISOStorages()),
    getVms: ({ vmId }) => dispatch(selectVmDetail({ vmId })),
  })
)(VmDialogPage)

export {
  PoolDetailPageConnected as PoolDetailPage,
  VmDetailPageConnected as VmDetailPage,
  VmDialogPageConnected as VmDialogPage,
  VmsPage,
}
