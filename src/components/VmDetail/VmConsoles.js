import React from 'react'
import PropTypes from 'prop-types'

import { isWindows, hrefWithoutHistory } from '../../helpers'
import { canConsole } from 'ovirt-ui-components'

import style from './style.css'

const VmConsoles = ({ vm, onConsole, onRDP }) => {
  const vmConsoles = vm.get('consoles').valueSeq()
  if (canConsole(vm.get('status'))) {
    return (
      <dd>
        {
          vmConsoles.map(c => {
            const onClick = (e) => {
              onConsole({ vmId: vm.get('id'), consoleId: c.get('id') })
              e.preventDefault()
            }

            return (
              <a
                href='#'
                data-toggle='tooltip'
                data-placement='left'
                title={`Open ${c.get('protocol').toUpperCase()} console`}
                key={c.get('id')}
                onClick={onClick}
                className={style['left-delimiter']}>
                {c.get('protocol').toUpperCase()}
              </a>
            )
          })
        }

        {
          isWindows(vm.getIn(['os', 'type']))
            ? (<a href='#' key={vm.get('id')} onClick={hrefWithoutHistory(onRDP)} className={style['left-delimiter']}>RDP</a>) : null
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
              key={c.get('id')}>
              {c.get('protocol').toUpperCase()}
            </span>
          ))
        }

        {
          isWindows(vm.getIn(['os', 'type']))
            ? (<span onClick={onRDP} className={style['console-vm-not-running']}>RDP</span>) : null
        }
      </span>
    </dd>
  )
}
VmConsoles.propTypes = {
  vm: PropTypes.object.isRequired,
  onConsole: PropTypes.func.isRequired,
  onRDP: PropTypes.func.isRequired,
}

export default VmConsoles
