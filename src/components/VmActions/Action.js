import React from 'react'
import PropTypes from 'prop-types'

import Button from './Button'
import { excludeKeys } from 'patternfly-react'

class Action extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showModal: false }
    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleOpen (e) {
    if (e && e.preventDefault) e.preventDefault()
    this.setState({ showModal: true })
  }

  handleClose () {
    this.setState({ showModal: false })
  }

  render () {
    const { children, confirmation } = this.props
    let trigger = children
    let confirmationDialog = confirmation || null
    if (confirmation) {
      trigger = React.cloneElement(trigger, { onClick: this.handleOpen })
      confirmationDialog = React.cloneElement(confirmationDialog, { show: this.state.showModal, onClose: this.handleClose })
    }
    return <React.Fragment>
      {trigger}
      {confirmationDialog}
    </React.Fragment>
  }
}

Action.propTypes = {
  children: PropTypes.node.isRequired,
  confirmation: PropTypes.node,
}

export default Action

const ActionButtonWraper = (props) => {
  const btnProps = excludeKeys(props, [ 'confirmation' ])
  return <Action confirmation={props.confirmation} key={props.shortTitle}><Button {...btnProps} /></Action>
}

ActionButtonWraper.propTypes = {
  confirmation: PropTypes.node,
  ...Button.propTypes,
}

export { ActionButtonWraper }
