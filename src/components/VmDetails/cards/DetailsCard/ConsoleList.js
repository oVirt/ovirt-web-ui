import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { canConsole } from '../../../../vm-status'
import { isWindows } from '../../../../helpers'

import Action from '../../../VmActions/Action'
import ConsoleConfirmationModal from '../../../VmActions/ConsoleConfirmationModal'
import WindowsRdpButton from '../../../VmActions/WindowsRdpButton'
import style from './style.css'

const ConsoleList = ({ vm }) => {
  const spiceConsole = vm.get('consoles').find(console => console.get('protocol') === 'spice')
  const vncConsole = vm.get('consoles').find(console => console.get('protocol') === 'vnc')
  const hasRdp = isWindows(vm.getIn(['os', 'type']))

  return !canConsole(vm.get('status'))
    ? (
      <div className={style['console-list-inactive']}>
        { spiceConsole && <span className={style['console-link']}>SPICE</span> }
        { vncConsole && <span className={style['console-link']}>VNC</span> }
        { hasRdp && <span className={style['console-link']}>RDP</span> }
      </div>
    )
    : (
      <div className={style['console-list-active']}>
        { spiceConsole &&
          <span className={style['console-link']}>
            <Action confirmation={<ConsoleConfirmationModal vm={vm} consoleId={spiceConsole.get('id')} />}>
              <a href='#'>SPICE</a>
            </Action>
          </span>
        }
        { vncConsole &&
          <span className={style['console-link']}>
            <Action confirmation={<ConsoleConfirmationModal vm={vm} consoleId={vncConsole.get('id')} />}>
              <a href='#'>VNC</a>
            </Action>
          </span>
        }
        { hasRdp && <WindowsRdpButton vm={vm} className={style['console-link']} /> }
      </div>
    )
}
ConsoleList.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  })
)(ConsoleList)
