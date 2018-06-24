import React from 'react'
import PropTypes from 'prop-types'

import { isWindows } from '../../helpers'
import { canConsole } from '../../vm-status'

import ConsoleButton from '../VmActions/ConsoleButton'
import WindowsRdpButton from '../VmActions/WindowsRdpButton'

import style from './style.css'

/**
 * Render a button for each type of console configured for the given VM, and if the VM
 * type is Windows add an RDP button.
 */
const VmConsoles = ({ vm }) => {
  const idPrefix = `vmconsoles-${vm.get('name')}`
  const vmConsoles = vm.get('consoles').valueSeq()
  const isWindowsVM = isWindows(vm.getIn(['os', 'type']))

  if (canConsole(vm.get('status'))) {
    return (
      <dd className={style['console-box']}>
        {
          vmConsoles.map(c => (
            <ConsoleButton
              vm={vm}
              consoleId={c.get('id')}
              key={c.get('id')}
              button=''
              className='pficon pficon-screen'
              tooltip={`Open ${c.get('protocol').toUpperCase()} console`} // TODO: l10n
              shortTitle={c.get('protocol').toUpperCase()}
            />
          ))
        }

        {isWindowsVM && <WindowsRdpButton vm={vm} className={style['left-delimiter']} />}
      </dd>
    )
  } else {
    return (
      <dd>
        <span>
          {
            vmConsoles.map(c => (
              <span
                className={style['console-vm-not-running']}
                key={c.get('id')}
                id={`${idPrefix}-${c.get('protocol')}-notrunning`}
              >
                {c.get('protocol').toUpperCase()}
              </span>
            ))
          }

          {isWindowsVM && (
            <span
              className={style['console-vm-not-running']}
              id={`${idPrefix}-rdp-notrunning`}
            >
              RDP
            </span>
          )}
        </span>
      </dd>
    )
  }
}
VmConsoles.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default VmConsoles
