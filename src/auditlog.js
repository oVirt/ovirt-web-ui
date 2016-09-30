import React, { Component } from 'react'
import './vms.css'

import {logDebug} from './helpers'

/**
 * Component displaying auditLog messages
 */
class AuditLog extends Component {
    renderTime (time) { // TODO: better!
        const t = new Date(time)
        return t.getHours() + ":" + t.getMinutes() + ":" + t.getSeconds()
    }
    render () {
        const {auditLog, config, dispatch} = this.props

        if (auditLog.show) {
            return (<table className="datatable table table-striped table-bordered">
                    <thead>
                    <tr>
                        <th>When</th>
                        <th>Message</th>
                        <th>Type</th>
                    </tr>
                    </thead>
                    <tbody>
                    {auditLog.records.map( r => {
                        logDebug(`rendering r: ${JSON.stringify(r)}`)
                        return (<tr key={r.time}>
                            <td>{this.renderTime(r.time)}</td>
                            <td>{r.message}</td>
                            <td>{r.type}</td>
                        </tr>)
                    })}
                    </tbody>
                </table>
            )
        }
        return (<div></div>)
    }
}
AuditLog.propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    auditLog: React.PropTypes.object.isRequired,
    config: React.PropTypes.object.isRequired
}

export default AuditLog