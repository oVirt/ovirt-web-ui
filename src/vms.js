import React, { Component } from 'react'
import './vms.css'

import VmDetail from './VmDetail'
import VmIcon from './VmIcon'
import VmStatusIcon from './VmStatusIcon'

import {selectVmDetail, shutdownVm, restartVm, startVm, getConsole} from './actions'
import {canRestart, canShutdown, canStart, canConsole} from './helpers'

/**
 * Data are fetched but no VM is available to display
 */
class NoVm extends Component {
  render () {// TODO
    return (
      <div className="blank-slate-pf">
        <div className="blank-slate-pf-icon">
          <span className="pficon pficon pficon-add-circle-o"></span>
        </div>
        <h1>
          No VM available
        </h1>
        <p>
          No VM can is available for the logged user.
        </p>
        <p>
          Learn more about this <a href="#">on the documentation</a>.
        </p>
        <div className="blank-slate-pf-main-action">
          <button className="btn btn-primary btn-lg"> Main Action </button>
        </div>
        <div className="blank-slate-pf-secondary-action">
          <button className="btn btn-default"> Secondary Action </button> <button className="btn btn-default"> Secondary Action </button> <button className="btn btn-default"> Secondary Action </button>
        </div>
      </div>
  )}
}

/**
 * Login (token) to Engine is missing.
 */
class NoLogin extends Component {
  render () {
    return (
        <div className="blank-slate-pf">
          <div className="blank-slate-pf-icon">
            <span className="pficon pficon pficon-user"></span>
          </div>
          <h1>
            Please log in ...
          </h1>
          <p>
            TODO: redirect
          </p>

        </div>
    )}
}

class LoadingData extends Component {
  render () {
    return (
        <div className="blank-slate-pf">
          <div className="blank-slate-pf-icon">
            <div className="spinner spinner-lg"></div>
          </div>
          <h1>
            Please wait
          </h1>
          <p>
            Data are being loaded ...
          </p>
        </div>
    )}
}

/**
 * Active actions on a single VM-card.
 * List of actions depends on the VM state.
 */
class VmActions extends Component {
  button ({className, tooltip='', onClick}) {
    return (
      <div className="card-pf-item">
        <span className={className} data-toggle="tooltip" data-placement="left" title={tooltip} onClick={onClick}>
        </span>
      </div>
  )}
  emptyAction (state) {
    if (!canConsole(state) && !canShutdown(state) && !canRestart(state) && !canStart(state)) {
      return (<div className="card-pf-item"></div>)
    }
  }
  render () {
    const {vm, dispatch} = this.props

    const vmId = vm.get('id')
    const status = vm.get('status')

    const onGetConsole = () => dispatch(getConsole({vm}))
    const onShutdown = () => dispatch(shutdownVm({vmId, force: false}))
    const onRestart = () => dispatch(restartVm({vmId, force: false}))
    const onStart = () => dispatch(startVm({vmId}))

    return (
    <div className="card-pf-items text-center">
      {this.emptyAction(status)}
      {canConsole(status) ? this.button({className: 'pficon pficon-screen', tooltip: 'Click to get console', onClick: onGetConsole}): ''}
      {canShutdown(status) ? this.button({className: 'fa fa-power-off', tooltip: 'Click to shut down the VM', onClick: onShutdown}): ''}
      {canRestart(status) ? this.button({className: 'fa fa-refresh', tooltip: 'Click to reboot the VM', onClick: onRestart}) : ''}
      {canStart(status) ? this.button({className: 'fa fa-angle-double-right', tooltip: 'Click to start the VM', onClick: onStart}) : ''}
    </div>
  )}
}
VmActions.propTypes = {
  vm: React.PropTypes.object.isRequired,
  dispatch: React.PropTypes.func.isRequired
}

class VmStatusText extends Component {
  render () {
    const {vm} = this.props
    const lastMessage = vm.get('lastMessage')
    const status = vm.get('status')

    if (lastMessage) {
      return (<div>
        <p className="crop" title={lastMessage} data-toggle="tooltip">
        <span className="pficon-warning-triangle-o"></span>&nbsp;{lastMessage}
        </p>
      </div>)
    } else {
      switch (status) {// TODO: review VM states
        case 'up':
        case 'powering_up':
        case 'paused':
        case 'migrating':
          return (<p className="card-pf-info text-center"><strong>Started On</strong>{vm.get('startTime')}</p>)
        default:
          return (<p className="card-pf-info text-center"><strong>Stopped On: </strong>{vm.get('stopTime')}</p>)
      }
    }
  }
}
VmStatusText.propTypes = {
  vm: React.PropTypes.object.isRequired
}

/**
 * Single icon-card in the list
 */
class Vm extends Component {
  render () {
    const {vm, dispatch} = this.props

    const onSelectVm = () => dispatch(selectVmDetail({vmId: vm.get('id')}))
    const state = vm.get('status')

    // TODO: improve the card flip:
    // TODO: https://davidwalsh.name/css-flip
    // TODO: http://tympanus.net/codrops/2013/12/18/perspective-page-view-navigation/
    // TODO: https://desandro.github.io/3dtransforms/docs/card-flip.html
    return (
      <div className="col-xs-12 col-sm-6 col-md-4 col-lg-3">
        <div className="card-pf card-pf-view card-pf-view-select card-pf-view-single-select">
          <div className="card-pf-body">
            <div className="card-pf-top-element" onClick={onSelectVm}>
              <VmIcon vmIcon={vm.getIn(['icons', 'large'])} className="card-pf-icon" missingIconClassName="fa fa-birthday-cake card-pf-icon-circle"/>
            </div>
            <h2 className="card-pf-title text-center" onClick={onSelectVm}>
              <VmStatusIcon state={state} />&nbsp;{vm.get('name')}
            </h2>

              <VmActions vm={vm} dispatch={dispatch}/>
              <VmStatusText vm={vm} />

          </div>
        </div>
      </div>
    )
  }
}
Vm.propTypes = {
  vm: React.PropTypes.object.isRequired,
  dispatch: React.PropTypes.func.isRequired
}

class Vms extends Component {
  renderVms ({vms, dispatch}) {
    const selectedVmId = vms.get('selected')
    const selectedVm = selectedVmId ? vms.get('vms').find( vm => vm.get('id') === selectedVmId) : undefined

    const containerClass = 'container-fluid container-cards-pf ' + (selectedVmId ? 'move-left' : 'move-left-remove')

    return (
      <span>
      <div className={containerClass}>
        <div className="row row-cards-pf">
          {vms.get('vms').map(vm => <Vm vm={vm} key={vm.get('id')} dispatch={dispatch}/>)}
        </div>
      </div>
      <VmDetail vm={selectedVm} dispatch={dispatch}/>
      </span>
  )}
  render () {
    const {vms, config, dispatch} = this.props
    if (vms.get('vms') && !vms.get('vms').isEmpty()) {
      return (this.renderVms({vms, dispatch}))
    } else if (!config.get('loginToken')) { // login is missing
      return (<div className="container-fluid">
        <NoLogin />
      </div>)
    } else if (vms.get('loadInProgress')) { // data load in progress
      return (<div className="container-fluid">
        <LoadingData />
      </div>)
    } else { // No VM available
        return (<div className="container-fluid">
          <NoVm />
        </div>)
      }
    }
}
Vms.propTypes = {
  vms: React.PropTypes.object.isRequired,
  config: React.PropTypes.object.isRequired,
  dispatch: React.PropTypes.func.isRequired
}

export default Vms
