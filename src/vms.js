import React, { Component } from 'react'
import './vms.css'
import {selectVmDetail, closeVmDetail, shutdownVm, restartVm, startVm, getConsole} from './actions'
import {canRestart, canShutdown, canStart, canConsole, logDebug} from './helpers'

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
            Please log in
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

class VmStatusIcon extends Component {
  render () {
    const {state} = this.props

    function iconElement ({className, tooltip}) {
      return (<span title={tooltip} data-toggle="tooltip" data-placement="left">
        <i className={className}></i>
      </span>
      )}

    switch (state) { // TODO: review VM states
      case 'up':
        return iconElement({className: 'pficon pficon-ok icon-1x-vms', tooltip: 'The VM is running.'});
      case 'powering_up':
        return iconElement({className: 'fa fa-angle-double-right icon-1x-vms', tooltip: 'The VM is powering up.'});
      case 'down':
        return iconElement({className: 'fa fa-arrow-circle-o-down icon-1x-vms', tooltip: 'The VM is down.'});
      case 'paused':
        return iconElement({className: 'pficon pficon-pause icon-1x-vms', tooltip: 'The VM is paused.'});
      case 'suspended':
        return iconElement({className: 'fa fa-shield icon-1x-vms', tooltip: 'The VM is suspended.'});
      case 'powering_down':
        return iconElement({className: 'glyphicon glyphicon-wrench icon-1x-vms', tooltip: 'The VM is going down.'});
      case 'not_responding':
        return iconElement({className: 'pficon pficon-warning-triangle-o icon-1x-vms', tooltip: 'The VM is not responding.'});
      case 'unknown':
        return iconElement({className: 'pficon pficon-help icon-1x-vms', tooltip: 'The VM status is unknown.'});
      case 'unassigned':
        return iconElement({className: 'pficon pficon-help icon-1x-vms', tooltip: 'The VM status is unassigned.'});
      case 'migrating':
        return iconElement({className: 'pficon pficon-service icon-1x-vms', tooltip: 'The VM is being migrated.'});
      case 'wait_for_launch':
        return iconElement({className: 'pficon pficon-service icon-1x-vms', tooltip: 'The VM is scheduled for launch.'});
      case 'reboot_in_progress':
        return iconElement({className: 'fa fa-refresh icon-1x-vms', tooltip: 'The VM is being rebooted.'});
      case 'saving_state':
        return iconElement({className: 'pficon pficon-export icon-1x-vms', tooltip: 'The VM is saving its state.'});
      case 'restoring_state':
        return iconElement({className: 'pficon pficon-import icon-1x-vms', tooltip: 'The VM is restoring its state.'});
      case 'image_locked':
        return iconElement({className: 'pficon pficon-volume icon-1x-vms', tooltip: 'The VM\'s image is locked'});

      case undefined: // better not to happen ...
        logDebug(`-- VmStatusIcon component: VM state is undefined`);
        return (<div />)
      default: // better not to happen ...
        logDebug(`-- VmStatusIcon component: unrecognized VM state '${state}'`);
        return iconElement({className: 'pficon pficon-zone', tooltip: `The VM state is '${state}'`})
    }
  }
}
VmStatusIcon.propTypes = {
  state: React.PropTypes.string.isRequired,
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

class VmIcon extends Component {
  render () {
    const {vmIcon, className, missingIconClassName} = this.props

    const content = vmIcon.get('content')
    const mediaType = vmIcon.get('mediaType')

    if (content) {
      const src = `data:${mediaType};base64,${content}`
      return (<img src={src} className={className} alt=""/>)
    }

    return (<span className={missingIconClassName}></span>)
  }
}
VmIcon.propTypes = {
  vmIcon: React.PropTypes.object.isRequired, // either vm.icons.large or vm.icons.small
  className: React.PropTypes.string.isRequired, // either card-pf-icon or vm-detail-icon
  missingIconClassName: React.PropTypes.string.isRequired
}

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

class VmDetail extends Component {
  componentDidMount () {
    this.onKeyDown = (event) => {
      if (event.keyCode === 27) { // ESC
        this.onClose()
      }
    }
    this.onClose = () => {
      this.props.dispatch(closeVmDetail())
    }

    window.addEventListener('keydown', this.onKeyDown);
  }
  componentWillUnmount () {
    window.removeEventListener('keydown', this.onKeyDown);
  }
  render () {
    const vm = this.props['vm'] // optional

    if (vm) {
      return (
        <div className="container-fluid move-left-detail">
          <a href="#" className="move-left-close-detail" onClick={this.onClose}><i className="pficon pficon-close"> Close</i></a>

          <h1><VmIcon vmIcon={vm.getIn(['icons', 'small'])} missingIconClassName="pficon pficon-virtual-machine" className="vm-detail-icon"/> {vm.get('name')}</h1>
          <dl>
            <dt>Operating System</dt>
            <dd>{vm.getIn(['os', 'type'])}</dd>
            <dt>State</dt>
            <dd>{vm.get('status')}</dd>
            <dt>ID</dt>
            <dd>{vm.get('id')}</dd>
            <dt>Defined Memory</dt>
            <dd>{vm.getIn(['memory', 'total'])}</dd>
            <dt>CPUs</dt>
            <dd>{vm.getIn(['cpu', 'vCPUs'])}</dd>
            <dt>CPU Arch</dt>
            <dd>{vm.getIn(['cpu', 'arch'])}</dd>
            <dt>High Availability</dt>
            <dd>{vm.getIn(['highAvailability', 'enabled'])}</dd>
            <dt>Address</dt>
            <dd>{vm.get('fqdn')}</dd>
          </dl>
        </div>
      )
    } else {
      return (<div className="move-left-detail-invisible" />)
    }
  }
}
Vm.propTypes = {
  vm: React.PropTypes.object,
  dispatch: React.PropTypes.func
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
