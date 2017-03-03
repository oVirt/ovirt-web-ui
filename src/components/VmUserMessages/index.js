import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './style.css'

import Time from '../Time'

import { clearUserMessages } from '../../actions/vm'

const UserMessage = ({ record }) => {
  // TODO: render record.type
  return (
    <li className={'list-group-item ' + style.crop} title={record.message} data-toggle='tooltip'>
      <span>
        <Time time={record.time} />
        <pre>
          {record.message}
        </pre>
      </span>
    </li>
  )
}
UserMessage.propTypes = {
  record: PropTypes.object.isRequired,
}

function isUnread (userMessages) {
  return userMessages.get('unread')
}

const VmUserMessages = ({ userMessages, onClearMessages }) => {
  return (
    <li className='dropdown'>
      <a href='#' data-toggle='dropdown'>
        <div className={isUnread(userMessages) ? style['usermsgs-unread'] : style['usermsgs-allread']}>
          <span className='pficon pficon-info' />&nbsp;Messages
        </div>
      </a>

      <div className='dropdown-menu infotip bottom-right'>
        <div className={`arrow ${style['fix-arrow-position']}`} />

        <ul className='list-group'>
          {userMessages.get('records').map(r => (<UserMessage key={r.time} record={r} />))}
        </ul>
        <div className='footer'><a href='#' onClick={onClearMessages}>Clear Messages</a></div>
      </div>
    </li>
  )
}

VmUserMessages.propTypes = {
  userMessages: PropTypes.object.isRequired,
  onClearMessages: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    userMessages: state.userMessages,
  }),
  (dispatch) => ({
    onClearMessages: () => dispatch(clearUserMessages()),
  })
)(VmUserMessages)
