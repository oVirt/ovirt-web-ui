import React, { useContext } from 'react'
import { Switch as PfSwitch } from 'patternfly-react'
import { enumMsg, MsgContext } from '_/intl'

const Switch = (props) => {
  const { msg } = useContext(MsgContext)
  return <PfSwitch
    onText={enumMsg('Switch', 'on', msg)}
    offTest={enumMsg('Switch', 'off', msg)}
    {...props}
  />
}

export default Switch
