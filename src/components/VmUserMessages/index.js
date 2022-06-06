import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core'

import { clearUserMessages, dismissEvent } from '_/actions'
import {
  getFormatedDateTime,
  buildMessageFromRecord,
  toJS,
  normalizeNotificationType,
  buildNotificationTitle,
} from '_/helpers'
import { MsgContext } from '_/intl'

const UserMessage = ({ record, id, onDismissMessage }) => {
  const { msg } = useContext(MsgContext)
  const [isOpen, setOpen] = useState(false)
  const { date, time } = getFormatedDateTime(record.time)
  const variant = normalizeNotificationType(record.type)
  return (
    <NotificationDrawerListItem variant={variant} isRead={false}>
      <NotificationDrawerListItemHeader
        variant={variant}
        title={buildNotificationTitle(record.titleDescriptor, msg, variant)}
      >
        <Dropdown
          id={id}
          position={DropdownPosition.right}
          onSelect={() => setOpen(!isOpen)}
          toggle={<KebabToggle onToggle={() => { setOpen(!isOpen); console.warn('toggle:', isOpen) } }/>}
          isOpen={isOpen}
          isPlain
          dropdownItems={[
            <DropdownItem key="action" onClick={onDismissMessage}>
              {msg.clear()}
            </DropdownItem>,
          ]}
        />
      </NotificationDrawerListItemHeader>
      <NotificationDrawerListItemBody timestamp={`${date} ${time}`}>
        { buildMessageFromRecord(record, msg) }
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  )
}
UserMessage.propTypes = {
  record: PropTypes.object.isRequired,
  id: PropTypes.string,
  onDismissMessage: PropTypes.func.isRequired,
}

const VmUserMessages = ({ userMessages, onClearMessages, onDismissMessage, onClose }) => {
  const { msg } = useContext(MsgContext)

  const idPrefix = 'usermsgs'

  const messagesCount = userMessages.get('records').size
  const messagesList = userMessages
    .get('records')
    .map(r => (
      <UserMessage
        key={`msg-${r.get('time')}`}
        record={toJS(r)}
        id={`${idPrefix}-msg-${r.get('time')}-dropdown`}
        onDismissMessage={() => onDismissMessage(r.toJS())}
      />
    ))

  return (
    <NotificationDrawer>
      <NotificationDrawerHeader
        count={messagesCount}
        title={msg.notifications()}
        onClose={onClose}
      >
        <Button
          isDisabled={!messagesCount}
          variant='link'
          onClick={() => onClearMessages(toJS(userMessages.get('records', [])))}
          // icon={<CloseIcon/>} // close button is on the right and used the same icon
        >
          { msg.clearAll() }
        </Button>
      </NotificationDrawerHeader>
      <NotificationDrawerBody>
        <NotificationDrawerList>
          {messagesList}
        </NotificationDrawerList>
      </NotificationDrawerBody>
    </NotificationDrawer>
  )
}
VmUserMessages.propTypes = {
  userMessages: PropTypes.object.isRequired,
  onClearMessages: PropTypes.func.isRequired,
  onDismissMessage: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    userMessages: state.userMessages,
  }),
  (dispatch) => ({
    onClearMessages: (records) => dispatch(clearUserMessages(records)),
    onDismissMessage: (event) => dispatch(dismissEvent({ event })),
  })
)(VmUserMessages)
