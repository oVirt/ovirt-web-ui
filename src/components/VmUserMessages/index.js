import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './style.css'

import Time from '../Time'

import { clearUserMessages } from '../../actions/vm'

const UserMessage = ({ record }) => {
  // TODO: render record.type
  return (
    <li className={`list-group-item ${style.crop}`} title={record.message} data-toggle='tooltip'>
      <span>
        <pre className={style['message-box']}>
          <Time time={record.time} cssClass={style['usermsg-time']} />
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

const ContactAdminInfo = ({ userMessages }) => {
  if (userMessages.get('records').size === 0) {
    return null
  }

  return (
    <div className={style['contact-admin']}>
      Contact your administrator in case of issues
    </div>
  )
}
ContactAdminInfo.propTypes = {
  userMessages: PropTypes.object.isRequired,
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

        <ul className={`list-group ${style['messages-list']}`}>
          {userMessages.get('records').map(r => (<UserMessage key={r.time} record={r} />))}
        </ul>
        <ContactAdminInfo userMessages={userMessages} />
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
