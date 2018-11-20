import React from 'react'
import PropTypes from 'prop-types'

import { isWindows } from '_/helpers'
import { ActionButtonWraper } from '../VmActions/Action'
import ConsoleConfirmationModal from '../VmActions/ConsoleConfirmationModal'
import { canConsole } from '../../vm-status'

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

  return (canConsole(vm.get('status')))
    ? (
      <dd className={style['console-box']}>
        {
          vmConsoles.map(c => (
            <ActionButtonWraper
              key={c.get('id')}
              shortTitle={c.get('protocol').toUpperCase()}
              tooltip={`Open ${c.get('protocol').toUpperCase()} console`}
              className=''
              id={`${idPrefix}-button-console-${c.get('protocol')}`}
              confirmation={<ConsoleConfirmationModal vm={vm} consoleId={c.get('id')} />}
            />
          ))
        }

        {isWindowsVM && <WindowsRdpButton vm={vm} className={style['left-delimiter']} />}
      </dd>
    )
    : (
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
VmConsoles.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default VmConsoles
