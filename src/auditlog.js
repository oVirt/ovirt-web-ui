import React, { Component } from 'react'
import './vms.css'

import {logDebug, formatTwoDigits} from './helpers'

class AuditLogRecord extends Component {
    renderTime (time) { // TODO: better!
        const t = new Date(time)
        return formatTwoDigits(t.getHours()) + ":" + formatTwoDigits(t.getMinutes()) + ":" + formatTwoDigits(t.getSeconds())
    }
    render () {
        const {record} = this.props
        logDebug(`rendering record: ${JSON.stringify(record)}`)

        return (<tr>
            <td>{this.renderTime(record.time)}</td>
            <td>{record.message}</td>
            <td>{record.type}</td>
        </tr>)
    }
}
AuditLogRecord.propTypes = {
    record: React.PropTypes.object.isRequired
}

/**
 * Component displaying auditLog messages
 */
class AuditLog extends Component {
    render () {
        const {auditLog, config, dispatch} = this.props

        if (auditLog.get('show')) {
            return (<table className="datatable table table-striped table-bordered auditlog-table">
                    <thead>
                    <tr>
                        <th>When</th>
                        <th>Message</th>
                        <th>Type</th>
                    </tr>
                    </thead>
                    <tbody>
                    {auditLog.get('records').map( r => (<AuditLogRecord key={r.time} record={r}/>))}
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
