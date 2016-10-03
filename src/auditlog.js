import React, { Component } from 'react'
import './vms.css'

import {logDebug, formatTwoDigits} from './helpers'
import {clearAuditLogMessages} from './actions'

class AuditLogRecord extends Component {
    renderTime(time) { // TODO: better!
        const t = new Date(time)
        return formatTwoDigits(t.getHours()) + ":" + formatTwoDigits(t.getMinutes()) + ":" + formatTwoDigits(t.getSeconds())
    }

    render() {
        const {record} = this.props
        logDebug(`rendering record: ${JSON.stringify(record)}`)

        // TODO: record.type
        return (<li className="list-group-item crop" title={record.message} data-toggle="tooltip">
                {this.renderTime(record.time)}&nbsp;{record.message}
            </li>
        )
    }
}
AuditLogRecord.propTypes = {
    record: React.PropTypes.object.isRequired
}

class AuditLog extends Component {
    render() {
        const {auditLog,/*, config,*/ dispatch} = this.props

        const onClearMessages = () => dispatch(clearAuditLogMessages())

        return (<div className="dropdown-menu infotip bottom-right">
            <div className="arrow"></div>

            <ul className="list-group">
                {auditLog.get('records').map( r => (<AuditLogRecord key={r.time} record={r}/>))}
            </ul>
            <div className="footer"><a href="#" onClick={onClearMessages}>Clear Messages</a></div>
        </div>)
    }

}
AuditLog.propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    auditLog: React.PropTypes.object.isRequired,
//    config: React.PropTypes.object.isRequired
}


export default AuditLog
