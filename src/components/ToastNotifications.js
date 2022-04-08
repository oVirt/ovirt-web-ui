import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Alert, AlertGroup, AlertActionCloseButton } from '@patternfly/react-core'
import { setNotificationNotified } from '_/actions'
import { withMsg } from '_/intl'
import {
  buildMessageFromRecord,
  normalizeNotificationType,
  buildNotificationTitle,
} from '_/helpers'

import style from './sharedStyle.css'

const ToastNotifications = ({ userMessages, onDismissNotification, msg }) => {
  return (
    <AlertGroup isToast isLiveRegion>
      { userMessages.get('records').toJS().filter(({ notified }) => !notified).map(r => (
        <Alert
          variant={normalizeNotificationType(r.type)}
          className={style['toast-margin-top']}
          title={buildNotificationTitle(r.titleDescriptor, msg, normalizeNotificationType(r.type))}
          timeout={true}
          onTimeout={() => onDismissNotification(r.id)}
          actionClose={(
            <AlertActionCloseButton
              onClose={() => onDismissNotification(r.id)}
            />
          )}
          key={r.time}
        >
          {buildMessageFromRecord(r, msg)}
        </Alert>
      )
      )}
    </AlertGroup>
  )
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
