import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'

import Time from '../Time'

import { clearUserMessages } from '../../actions/vm'
import { hrefWithoutHistory } from '../../helpers'
import { msg } from '../../intl'

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

class VmUserMessages extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      show: false,
    }
  }

  render () {
    const { userMessages, onClearMessages } = this.props

    const onToggle = () => {
      this.setState({ show: !this.state.show })
    }

    let show = ''
    if (this.state.show) {
      show = 'show'
    }

    return (
      <li className='dropdown'>
        <a href='#' onClick={hrefWithoutHistory(onToggle)}>
          <div className={isUnread(userMessages) ? style['usermsgs-unread'] : style['usermsgs-allread']}>
            <span className='pficon pficon-info' />&nbsp;{msg.messages()}
          </div>
        </a>

        <div className={`dropdown-menu dropdown-menu-right infotip bottom-right ${show}`}>
          <div className={`arrow ${style['fix-arrow-position']}`} />

          <ul className={`list-group ${style['messages-list']}`}>
            {userMessages.get('records').map(r => (<UserMessage key={r.time} record={r} />))}
          </ul>
          <ContactAdminInfo userMessages={userMessages} />

          <div className='footer'>
            <a href='#' onClick={hrefWithoutHistory(onClearMessages)}>{msg.clearMessages()}</a>
            <a href='#' onClick={hrefWithoutHistory(onToggle)} className={style['close-button']}>{msg.close()}</a>
          </div>
        </div>
      </li>
    )
  }
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
