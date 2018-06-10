import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import VmDetail from '../VmDetail'
import VmDialog from '../VmDialog'
import VmsList from '../VmsList'

import { selectVmDetail, selectPoolDetail, getISOStorages, getConsoleOptions } from '../../actions'

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
    this.state = {
      vmId: undefined,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.vmId !== props.match.params.id) {
      const vmId = props.match.params.id

      // Assume the VM is not in props.vms, was shallow fetched or is stale.
      // Force a refresh when it is selected for viewing.
      props.getConsoleOptions(vmId)
      props.getVmById(vmId)
      return { vmId }
    }

    return null
  }

  render () {
    const { vms, config } = this.props
    const { vmId } = this.state

    if (vms.getIn(['vms', vmId])) {
      return (<VmDetail vm={vms.getIn(['vms', vmId])} config={config} />)
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`VmDetailPage: VM id cannot be found: ${vmId}`)
    return null
  }
}
VmDetailPage.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,

  getVmById: PropTypes.func.isRequired,
  getConsoleOptions: PropTypes.func.isRequired,
}
const VmDetailPageConnected = connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
  }),
  (dispatch) => ({
    getVmById: (vmId) => dispatch(selectVmDetail({ vmId })),
    getConsoleOptions: (vmId) => dispatch(getConsoleOptions({ vmId })),
  })
)(VmDetailPage)

/**
 * Route component (for PageRouter) to view a Pool's details
 */
class PoolDetailPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      poolId: undefined,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.poolId !== props.match.params.id) {
      const poolId = props.match.params.id

      // Assume the Pool is not in props.pools, was shallow fetched or is stale.
      // Force a refresh when it is selected for viewing.
      props.getPoolById(poolId)
      return { poolId }
    }

    return null
  }

  render () {
    const { vms, config } = this.props
    const { poolId } = this.state

    if (vms.getIn(['pools', poolId, 'vm'])) {
      return (<VmDetail vm={vms.getIn(['pools', poolId, 'vm'])} pool={vms.getIn(['pools', poolId])} config={config} />)
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`PoolDetailPage: Pool id cannot be found: ${poolId}`)
    return null
  }
}
PoolDetailPage.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,

  getPoolById: PropTypes.func.isRequired,
}
const PoolDetailPageConnected = connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
  }),
  (dispatch) => ({
    getPoolById: (poolId) => dispatch(selectPoolDetail({ poolId })),
  })
)(PoolDetailPage)

/**
 * Route component (for PageRouter) to create or edit a VM
 */
class VmDialogPage extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      vmId: undefined,
    }
  }

  static getDerivedStateFromProps (props, state) {
    if (state.vmId !== props.match.params.id) {
      const vmId = props.match.params.id

      // Assume the VM is not in props.vms, was shallow fetched or is stale.
      // Force a refresh when it is selected for editing.
      props.getAvailableCDImages()
      props.getVmById(vmId)
      return { vmId }
    }

    return null
  }

  render () {
    const { vms, previousPath } = this.props
    const { vmId } = this.state

    if (/\/add$/.test(this.props.match.path)) {
      return <VmDialog previousPath={previousPath} />
    } else if (vmId && vms.getIn(['vms', vmId])) {
      return <VmDialog previousPath={previousPath} vm={vms.getIn(['vms', vmId])} />
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`VmDialogPage: VM id cannot be found: ${vmId}`)
    return null
  }
}
VmDialogPage.propTypes = {
  vms: PropTypes.object.isRequired,
  previousPath: PropTypes.string.isRequired,
  match: PropTypes.object.isRequired,

  getAvailableCDImages: PropTypes.func.isRequired,
  getVmById: PropTypes.func.isRequired,
}
const VmDialogPageConnected = connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
    getAvailableCDImages: () => dispatch(getISOStorages()),
    getVmById: (vmId) => dispatch(selectVmDetail({ vmId })),
  })
)(VmDialogPage)

export {
  PoolDetailPageConnected as PoolDetailPage,
  VmDetailPageConnected as VmDetailPage,
  VmDialogPageConnected as VmDialogPage,
  VmsPage,
}
