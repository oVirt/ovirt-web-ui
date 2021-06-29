import React, { useContext } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { DropdownButton } from 'patternfly-react'
import { MenuItemAction } from '../VmActions/Action'
import { getConsoleActions } from '../VmActions'
import { MsgContext } from '_/intl'
import { openConsole } from '_/actions'
import style from './style.css'

const VmConsoleSelector = ({ vmId, vm, config, consoleType, isConsolePage, onOpenConsole, preferredConsole }) => {
  const { msg } = useContext(MsgContext)
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

  const consoleItems = actions.map(({ id, consoleType, onClick, icon, shortTitle }) => (
    <MenuItemAction
      id={id}
      key={consoleType}
      onClick={onClick}
      shortTitle={shortTitle}
      icon={icon}
    />
  ))

  const { shortTitle: activeConsole = '' } = actions.find(a => a.consoleType === consoleType) || {}

  return (
    <div className={style['console-dropdown-box']}>
      <span className={style['console-dropdown-label']}>{`${msg.console()}:`}</span>
      <DropdownButton
        title={activeConsole}
        bsStyle='default'
        id='console-selector'
      >
        { consoleItems }
      </DropdownButton>
    </div>
  )
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
  ({ vms, consoles, config, options }, { vmId, consoleType, isConsolePage }) => ({
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
