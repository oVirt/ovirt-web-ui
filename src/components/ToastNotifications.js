import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { TimedToastNotification, ToastNotificationList } from 'patternfly-react'
import { setNotificationNotified } from '_/actions'
import { withMsg } from '_/intl'
import { buildMessageFromRecord } from '_/helpers'

import style from './sharedStyle.css'

function normalizeType (theType) {
  theType = String(theType).toLowerCase()
  const isExpected = ['error', 'warning', 'success', 'info', 'danger'].includes(theType)
  return isExpected ? theType : 'warning'
}

const ToastNotifications = ({ userMessages, onDismissNotification, msg }) => {
  return <ToastNotificationList>
    { userMessages.get('records').filter(r => !r.get('notified')).map(r =>
      <TimedToastNotification
        className={style['toast-margin-top']}
        type={normalizeType(r.get('type'))}
        onDismiss={() => onDismissNotification(r.get('id'))}
        key={r.get('time')}
      >
        <span>
          {buildMessageFromRecord(r.toJS(), msg)}
        </span>
      </TimedToastNotification>
    )}
  </ToastNotificationList>
}

ToastNotifications.propTypes = {
  userMessages: PropTypes.object.isRequired,
  onDismissNotification: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    userMessages: state.userMessages,
  }),
  (dispatch) => ({
    onDismissNotification: (eventId) => dispatch(setNotificationNotified({ eventId })),
  })
)(withMsg(ToastNotifications))
