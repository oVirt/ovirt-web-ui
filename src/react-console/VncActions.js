import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { MenuItem, Button, DropdownButton, noop } from 'patternfly-react'

const VncActions = ({
  textSendShortcut,
  textCtrlAltDel,
  toolbarContainer,
  textDisconnect,
  additionalButtons,
  onCtrlAltDel,
  onDisconnect,
}) => {
  const toolbar = <div>
    {additionalButtons}
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
  if (!toolbarContainer) {
    return toolbar
  }
  return document.getElementById(toolbarContainer) &&
    ReactDOM.createPortal(
      toolbar,
      document.getElementById(toolbarContainer)
    )
}

VncActions.propTypes = {
  onCtrlAltDel: PropTypes.func,
  onDisconnect: PropTypes.func,
  onFullScreen: PropTypes.func,

  textCtrlAltDel: PropTypes.string,
  textSendShortcut: PropTypes.string,
  textDisconnect: PropTypes.string,
  toolbarContainer: PropTypes.string,
  textFullScreen: PropTypes.string,

  additionalButtons: PropTypes.arrayOf(PropTypes.node),
}

VncActions.defaultProps = {
  onCtrlAltDel: noop,
  onDisconnect: noop,
  onFullScreen: noop,

  textCtrlAltDel: 'Ctrl+Alt+Del',
  textSendShortcut: 'Send Key',
  textDisconnect: 'Disconnect',
  textFullScreen: 'Full Screen',
  toolbarContainer: '',

  additionalButtons: [],
}

export default VncActions
