import React, { useContext } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { getConsoleActions } from '../VmActions'
import { MsgContext } from '_/intl'
import { openConsole } from '_/actions'
import SelectBox from '../SelectBox'
import {
  ToolbarItem,
} from '@patternfly/react-core'

const VmConsoleSelector = ({ vmId, vm, config, consoleType, isConsolePage, onOpenConsole, preferredConsole }) => {
  const { msg, locale } = useContext(MsgContext)
  const actions = getConsoleActions({
    vm,
    msg,
    onOpenConsole,
    idPrefix: 'vmconsoleselector',
    config,
    preferredConsole,
  })

  if (!actions.length) {
    return <div />
  }

  const consoleItems = actions.map(({ id, consoleType, onClick, icon, shortTitle }) => ({
    id: consoleType,
    key: consoleType,
    value: shortTitle,
  }))

  return [
    <ToolbarItem key="label" variant="label" >
      {msg.console()}
    </ToolbarItem>,
    <ToolbarItem key="console-selector">
      <SelectBox
        selected={consoleType}
        items={consoleItems}
        onChange={(consoleType) => actions.find(({ consoleType: type }) => type === consoleType)?.onClick()}
        id='console-selector'
        msg={msg}
        locale={locale}
      />
    </ToolbarItem>,
  ]
}

VmConsoleSelector.propTypes = {
  // own
  vmId: PropTypes.string.isRequired,
  consoleType: PropTypes.string.isRequired,
  isConsolePage: PropTypes.bool,
  // connected
  vm: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  onOpenConsole: PropTypes.func.isRequired,
  preferredConsole: PropTypes.string.isRequired,
}

export default connect(
  ({ vms, config, options }, { vmId, consoleType, isConsolePage }) => ({
    vm: vms.getIn(['vms', vmId]),
    config,
    preferredConsole: options.getIn(['remoteOptions', 'preferredConsole', 'content'], config.get('defaultUiConsole')),
  }),
  (dispatch, { vmId, consoleType, isConsolePage }) => ({
    onOpenConsole: ({ consoleType }) => dispatch(openConsole({
      vmId,
      consoleType,
      openInPage: isConsolePage,
    })),

  })
)(VmConsoleSelector)
