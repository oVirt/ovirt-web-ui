import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { MenuItem, Button, DropdownButton, noop } from 'patternfly-react'

const VncActions = ({
  textSendShortcut,
  textCtrlAltDel,
  portalToolbarTo,
  textDisconnect,
  onCtrlAltDel,
  onDisconnect,
}) => {
  const toolbar = <div>
    <DropdownButton bsStyle='default' title={textSendShortcut} id='console-send-shortcut' onClick={noop}>
      <MenuItem eventKey='1' onClick={onCtrlAltDel}>
        {textCtrlAltDel}
      </MenuItem>
    </DropdownButton>
    <Button
      bsStyle='default'
      onClick={onDisconnect}
    >
      {textDisconnect}
    </Button>
  </div>
  if (!portalToolbarTo) {
    return toolbar
  }
  return document.getElementById(portalToolbarTo) &&
    ReactDOM.createPortal(
      toolbar,
      document.getElementById(portalToolbarTo)
    )
}

VncActions.propTypes = {
  onCtrlAltDel: PropTypes.func,
  onDisconnect: PropTypes.func,

  textCtrlAltDel: PropTypes.string,
  textSendShortcut: PropTypes.string,
  textDisconnect: PropTypes.string,
  portalToolbarTo: PropTypes.string,
}

VncActions.defaultProps = {
  onCtrlAltDel: noop,
  onDisconnect: noop,

  textCtrlAltDel: 'Ctrl+Alt+Del',
  textSendShortcut: 'Send Key',
  textDisconnect: 'Disconnect',
  portalToolbarTo: '',
}

export default VncActions
