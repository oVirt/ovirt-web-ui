/**
 * Created by mlibra on 5.10.16.
 */
import React, { Component } from 'react'
import {logDebug} from './helpers'

/**
 * Status-dependant icon for a VM
 */
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

export default VmStatusIcon
