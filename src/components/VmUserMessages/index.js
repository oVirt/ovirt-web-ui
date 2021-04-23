import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Notification, NotificationDrawer, MenuItem, Icon, Button } from 'patternfly-react'

import style from './style.css'

import { clearUserMessages, dismissEvent } from '_/actions'
import { getFormatedDateTime, buildMessageFromRecord } from '_/helpers'
import { MsgContext } from '_/intl'

const UserMessage = ({ record, id, onDismissMessage }) => {
  const { msg } = useContext(MsgContext)
  const time = getFormatedDateTime(record.get('time'))
  return (<Notification seen>
    <NotificationDrawer.Dropdown id={id}>
      <MenuItem onClick={onDismissMessage}>
        { msg.clear() }
      </MenuItem>
    </NotificationDrawer.Dropdown>
    <Icon className='pull-left' type='pf' name='warning-triangle-o' />
    <Notification.Content>
      <Notification.Message>
        { buildMessageFromRecord(record.toJS(), msg) }
      </Notification.Message>
      <Notification.Info leftText={time.date} rightText={time.time} />
    </Notification.Content>
  </Notification>)
}
UserMessage.propTypes = {
  record: PropTypes.object.isRequired,
  id: PropTypes.string,
  onDismissMessage: PropTypes.func.isRequired,
}

const VmUserMessages = ({ userMessages, onClearMessages, onDismissMessage, onClose, show }) => {
  const { msg } = useContext(MsgContext)
  const [expanded, setExpanded] = useState(false)

  const idPrefix = `usermsgs`

  const messagesCount = userMessages.get('records').size
  const messagesList = messagesCount
    ? userMessages.get('records').map(r => (
      <UserMessage
        key={`msg-${r.get('time')}`}
        record={r}
        id={`${idPrefix}-msg-${r.get('time')}-dropdown`}
        onDismissMessage={() => onDismissMessage(r.toJS())}
      />
    ))
    : <NotificationDrawer.EmptyState title={msg.noMessages()} />

  return (
    <NotificationDrawer hide={!show} expanded={expanded}>
      <NotificationDrawer.Title title={msg.notifications()} onCloseClick={onClose} onExpandClick={() => setExpanded(!expanded)} />
      <NotificationDrawer.PanelBody className={style['panel-body']}>
        <div className={style['notifications-list']}>
          {messagesList}
        </div>
        { messagesCount > 0 &&
          <NotificationDrawer.PanelAction className={style['action-panel']}>
            <NotificationDrawer.PanelActionLink data-toggle='clear-all'>
              <Button bsStyle='link' onClick={onClearMessages}>
                <Icon type='pf' name='close' />
                { msg.clearAll() }
              </Button>
            </NotificationDrawer.PanelActionLink>
          </NotificationDrawer.PanelAction>
        }
      </NotificationDrawer.PanelBody>
    </NotificationDrawer>
  )
}
VmUserMessages.propTypes = {
  userMessages: PropTypes.object.isRequired,
  onClearMessages: PropTypes.func.isRequired,
  onDismissMessage: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
}

export default connect(
  (state) => ({
    userMessages: state.userMessages,
  }),
  (dispatch) => ({
    onClearMessages: () => dispatch(clearUserMessages()),
    onDismissMessage: (event) => dispatch(dismissEvent({ event })),
  })
)(VmUserMessages)
