import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Alert, AlertGroup, AlertActionCloseButton } from '@patternfly/react-core'
import { setNotificationNotified } from '_/actions'
import { withMsg } from '_/intl'
import { buildMessageFromRecord, translate } from '_/helpers'

import style from './sharedStyle.css'

function normalizeType (theType) {
  theType = String(theType).toLowerCase()
  // PF4 statuses
  if (['default', 'warning', 'success', 'info', 'danger'].includes(theType)) {
    return theType
  }

  // 'error' (used in PF3) was replaced by 'danger'
  return theType === 'error' ? 'danger' : 'warning'
}

function buildTitle ({ id, params } = {}, msg, type) {
  if (!id) {
    // no title provide - generate one based on type
    return mapTypeToTitle(msg, type)
  }
  return translate({ id, params, msg })
}

function mapTypeToTitle (msg, type) {
  switch (type) {
    case 'warning':
      return msg.warning()
    case 'danger':
      return msg.error()
    case 'success':
      return msg.success()
    case 'info':
    default:
      return msg.info()
  }
}

const ToastNotifications = ({ userMessages, onDismissNotification, msg }) => {
  return (
    <AlertGroup isToast isLiveRegion>
      { userMessages.get('records').toJS().filter(({ notified }) => !notified).map(r => (
        <Alert
          variant={normalizeType(r.type)}
          className={style['toast-margin-top']}
          title={buildTitle(r.titleDescriptor, msg, normalizeType(r.type))}
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
