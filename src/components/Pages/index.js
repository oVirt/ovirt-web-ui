import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

import VmDetail from '../VmDetail'
import VmDialog from '../VmDialog/index'
import { selectVmDetail, selectPoolDetail, getISOStorages } from '../../actions/index'

import Selectors from '../../selectors'

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
    } else {
      if (vms.get('loadInProgress')) {
        console.info('VmDetailPage: VM id can not be found: ', match.params.id, ' . Load is still in progress - wating before redirect')
        return null
      }
    }

    console.info('VmDetailPage: VM id can not be found: ', match.params.id, ' . Redirecting to / ')
    return <Redirect to='/' />
  }
}

VmDetailPage.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  getVms: PropTypes.func.isRequired,
  route: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  previousPath: PropTypes.string.isRequired,
}

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
    } else {
      if (vms.get('loadInProgress')) {
        return null
      }
    }
    return <Redirect to='/' />
  }
}

PoolDetailPage.propTypes = {
  vms: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  getPools: PropTypes.func.isRequired,
  route: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  previousPath: PropTypes.string.isRequired,
}

class VmDialogPage extends React.Component {
  componentWillMount () {
    this.props.getCDRom() // refresh data
    if (this.props.match.params.id) {
      this.props.getVms({ vmId: this.props.match.params.id }) // refresh data

      // in case the location is entered from outside
    }
  }

  render () {
    let { match, vms, previousPath } = this.props
    if ((match.params.id && vms.getIn(['vms', match.params.id])) || !match.params.id) {
      return (<VmDialog vm={vms.getIn(['vms', match.params.id])} previousPath={previousPath} />)
    }
    return null
  }
}

VmDialogPage.propTypes = {
  vms: PropTypes.object.isRequired,
  getVms: PropTypes.func.isRequired,
  getCDRom: PropTypes.func.isRequired,
  route: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  previousPath: PropTypes.string.isRequired,
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

const PoolDetailPageConnected = connect(
  (state) => ({
    vms: state.vms,
    config: state.config,
  }),
  (dispatch) => ({
    getPools: ({ poolId }) => dispatch(selectPoolDetail({ poolId })),
  })
)(PoolDetailPage)

const VmDialogPageConnected = connect(
  (state) => ({
    vms: state.vms,
  }),
  (dispatch) => ({
    getVms: ({ vmId }) => dispatch(selectVmDetail({ vmId })),
    getCDRom: () => dispatch(getISOStorages()),
  })
)(VmDialogPage)

export {
  PoolDetailPageConnected as PoolDetailPage,
  VmDetailPageConnected as VmDetailPage,
  VmDialogPageConnected as VmDialogPage,
}
