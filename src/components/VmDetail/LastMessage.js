import React from 'react'
import PropTypes from 'prop-types'

import Time from '../Time'

const LastMessage = ({ vm, userMessages }) => {
  const vmId = vm.get('id')
  const idPrefix = `${vm.get('name')}-lastmessage`

  const vmMessages = userMessages.get('records')
    .filter(msg => (msg.failedAction && msg.failedAction.payload && msg.failedAction.payload.vmId === vmId))
    .sort((msg1, msg2) => (msg1.time - msg2.time))

  const lastMessage = vmMessages.last()

  if (!lastMessage) {
    return null
  }
  return (
    <span>
      <Time time={lastMessage.time} id={`${idPrefix}-time`} />
      <pre id={`${idPrefix}-message`}>
        {lastMessage.message}
      </pre>
    </span>
  )
}
LastMessage.propTypes = {
  vm: PropTypes.object.isRequired,
  userMessages: PropTypes.object.isRequired,
}

export default LastMessage
