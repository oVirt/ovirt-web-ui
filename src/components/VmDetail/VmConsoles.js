import React from 'react'
import PropTypes from 'prop-types'

import { isWindows, hrefWithoutHistory } from '../../helpers'
import ConsoleButton from '../VmActions/ConsoleButton'
import { canConsole } from '../../vm-status'

import style from './style.css'

const VmConsoles = ({ vm, onConsole, onRDP, usbFilter }) => {
  const idPrefix = `vmconsoles-${vm.get('name')}`
  const vmConsoles = vm.get('consoles').valueSeq()
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
              tooltip={`Open ${c.get('protocol').toUpperCase()} console`}
              shortTitle={c.get('protocol').toUpperCase()}
              usbFilter={usbFilter}
            />
          ))
        }

        {
          isWindows(vm.getIn(['os', 'type']))
            ? (<a href='#' key={vm.get('id')} id={`${idPrefix}-rdp`} onClick={hrefWithoutHistory(onRDP)} className={style['left-delimiter']}>RDP</a>) : null
        }
      </dd>
    )
  }

  return (
    <dd>
      <span>
        {
          vmConsoles.map(c => (
            <span
              className={style['console-vm-not-running']}
              key={c.get('id')}
              id={`${idPrefix}-${c.get('protocol')}-notrunning`}>
              {c.get('protocol').toUpperCase()}
            </span>
          ))
        }

        {
          isWindows(vm.getIn(['os', 'type']))
            ? (<span onClick={onRDP} className={style['console-vm-not-running']} id={`${idPrefix}-rdp-notrunning`}>RDP</span>) : null
        }
      </span>
    </dd>
  )
}
VmConsoles.propTypes = {
  vm: PropTypes.object.isRequired,
  usbFilter: PropTypes.string.isRequired,
  onConsole: PropTypes.func.isRequired,
  onRDP: PropTypes.func.isRequired,
}

export default VmConsoles
