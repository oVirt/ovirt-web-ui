import React, { useContext, useEffect } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { addUserMessage, downloadVmConsoles } from '_/actions'
import ConsoleConfirmationModal from '_/components/VmActions/ConsoleConfirmationModal'
import {
  EMPTY_CONSOLES_LIST,
  NO_DEFAULT_CONSOLE,
} from '_/constants'
import { MsgContext } from '_/intl'

const DEFAULT_CONSOLE_PROTOCOL_ERRORS_LIST = [
  NO_DEFAULT_CONSOLE,
  EMPTY_CONSOLES_LIST,
]

const AutoSelectConsole = ({
  vm,
  show,
  isNoVnc,
  fetchConsoles,
  id,
  onClose,
  defaultConsole,
  setUserMessage,
}) => {
  const { msg } = useContext(MsgContext)
  useEffect(() => {
    if (show && defaultConsole === 'undefined') {
      fetchConsoles(vm)
    }
  }, [show])

  useEffect(() => {
    if (show && DEFAULT_CONSOLE_PROTOCOL_ERRORS_LIST.includes(defaultConsole)) {
      const vmName = vm.get('name', '')
      const message = defaultConsole === EMPTY_CONSOLES_LIST
        ? msg.consoleNotAvailableHeadless({ vmName })
        : defaultConsole === NO_DEFAULT_CONSOLE
          ? msg.consoleDefaultNotAvailable({ vmName, defaultConsole })
          : false
      if (message) {
        setUserMessage(message)
      }
      onClose()
    }
  }, [defaultConsole, show, msg])

  const isProtocolSelected = (defaultConsole) => defaultConsole !== 'undefined' && !DEFAULT_CONSOLE_PROTOCOL_ERRORS_LIST.includes(defaultConsole)

  return (
    <div>
      {show && isProtocolSelected(defaultConsole) &&
      <ConsoleConfirmationModal
        consoleId={defaultConsole.id}
        vm={vm}
        show
        isNoVNC={defaultConsole.protocol === 'vnc' ? isNoVnc : false}
        onClose={() => isProtocolSelected(defaultConsole) && onClose()}
        id={id}
      />
      }
    </div>
  )
}

AutoSelectConsole.propTypes = {
  vm: PropTypes.object.isRequired,
  show: PropTypes.bool,
  isNoVnc: PropTypes.bool,
  fetchConsoles: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  setUserMessage: PropTypes.func.isRequired,
  defaultConsole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
}

export default connect(
  (state, { vm }) => ({
    defaultConsole: vm.get('defaultConsole'),
    isNoVnc: state.config.get('defaultVncMode') === 'NoVnc',
  }),
  (dispatch, { vm }) => ({
    fetchConsoles: () => dispatch(downloadVmConsoles({ vm })),
    setUserMessage: (message) => dispatch(addUserMessage({ type: 'error', message })),
  })
)(AutoSelectConsole)
