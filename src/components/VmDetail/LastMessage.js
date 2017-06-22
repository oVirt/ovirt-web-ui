import React from 'react'
import PropTypes from 'prop-types'

import Time from '../Time'

const LastMessage = ({ vmId, userMessages }) => {
  const vmMessages = userMessages.get('records')
    .filter(msg => (msg.failedAction && msg.failedAction.payload && msg.failedAction.payload.vmId === vmId))
    .sort((msg1, msg2) => (msg1.time - msg2.time))

  const lastMessage = vmMessages.last()

  if (!lastMessage) {
    return null
  }

  return (
    <span>
      <Time time={lastMessage.time} />
      <pre>
        {lastMessage.message}
      </pre>
    </span>
  )
}
LastMessage.propTypes = {
  vmId: PropTypes.string.isRequired,
  userMessages: PropTypes.object.isRequired,
}

export default LastMessage
