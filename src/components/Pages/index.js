import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import VmDetail from '../VmDetail'
import VmDialog from '../VmDialog'
import VmsList from '../VmsList'

import { selectVmDetail, selectPoolDetail, getISOStorages } from '../../actions'

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

  fetchTheVmIfNeeded () {
    const { match, vms, getVms } = this.props
    let requested = false

    if (!this.requestSent && !vms.getIn(['vms', match.params.id])) {
      this.requestSent = requested = true
      getVms({ vmId: match.params.id })
    }

    return requested
  }

  componentWillMount () {
    this.fetchTheVmIfNeeded()
  }

  componentWillUpdate () {
    this.fetchTheVmIfNeeded()
  }

  render () {
    const { match, vms, config } = this.props

    if (vms.getIn(['vms', match.params.id])) {
      return (<VmDetail vm={vms.getIn(['vms', match.params.id])} config={config} />)
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`VmDetailPage: VM id cannot be found: ${match.params.id}`)
    return null
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
    requestActive: !state.activeRequests.isEmpty(),
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

  fetchThePoolIfNeeded () {
    const { match, vms, getPools } = this.props
    let requested = false

    if (!this.requestSent && !vms.getIn(['pools', match.params.id, 'vm'])) {
      this.requestSent = requested = true
      getPools({ poolId: match.params.id })
    }

    return requested
  }

  componentWillMount () {
    this.fetchThePoolIfNeeded()
  }

  componentWillUpdate () {
    this.fetchThePoolIfNeeded()
  }

  render () {
    const { match, vms, config } = this.props

    if (vms.getIn(['pools', match.params.id, 'vm'])) {
      return (<VmDetail vm={vms.getIn(['pools', match.params.id, 'vm'])} pool={vms.getIn(['pools', match.params.id])} config={config} />)
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`PoolDetailPage: Pool id cannot be found: ${match.params.id}`)
    return null
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
    requestActive: !state.activeRequests.isEmpty(),
  }),
  (dispatch) => ({
    getPools: ({ poolId }) => dispatch(selectPoolDetail({ poolId })),
  })
)(PoolDetailPage)

/**
 * Route component (for PageRouter) to create or edit a VM
 */
class VmDialogPage extends React.Component {
  constructor (props) {
    super(props)
    this.requestSent = false
    this.isAdd = !props.match.params.id || /\/add$/.test(props.match.path)
  }

  fetchTheVmIfNeeded () {
    const { match, vms, getVms } = this.props
    let requested = false

    if (!this.isAdd && !this.requestSent && !vms.getIn(['vms', match.params.id])) {
      this.requestSent = requested = true
      getVms({ vmId: match.params.id })
    }

    return requested
  }

  componentWillMount () {
    this.props.getCDRom()

    const requested = this.fetchTheVmIfNeeded()
    if (requested) console.info(`VmDialogPage: WillMount requesting: ${this.props.match.params.id}`)
  }

  componentWillUpdate () {
    const requested = this.fetchTheVmIfNeeded()
    if (requested) console.info(`VmDialogPage: WillUpdate requested: ${this.props.match.params.id}`)
  }

  render () {
    const { match, vms, previousPath } = this.props

    if (this.isAdd) {
      return <VmDialog previousPath={previousPath} />
    } else if (match.params.id && vms.getIn(['vms', match.params.id])) {
      return <VmDialog previousPath={previousPath} vm={vms.getIn(['vms', match.params.id])} />
    }

    // TODO: Add handling for if the fetch runs but fails (FETCH-FAIL), see issue #631
    console.info(`VmDialogPage: VM id cannot be found: ${match.params.id}`)
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
    requestActive: !state.activeRequests.isEmpty(),
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
