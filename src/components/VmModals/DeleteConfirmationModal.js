import React from 'react'
import PropTypes from 'prop-types'
import { MessageDialog, Icon } from 'patternfly-react'
import { withMsg } from '_/intl'

class DeleteConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = { show: false }
    this.handleTriggerClick = this.handleTriggerClick.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }

  handleTriggerClick (e) {
    e.preventDefault()
    this.setState({ show: true })
  }

  handleClose () {
    this.setState({ show: false })
    this.props.onClose && this.props.onClose()
  }

  handleDelete () {
    this.setState({ show: false })
    this.props.onDelete()
  }

  render () {
    const {
      children,
      trigger,
      id,
      severity = 'normal',
      msg,
    } = this.props

    const primary = Array.isArray(children) ? children[0] : children
    const secondary = Array.isArray(children) ? children.slice(1) : undefined

    const icon = severity === 'normal'
      ? <Icon type='pf' name='warning-triangle-o' />
      : <Icon type='pf' name='error-circle-o' />
    const primaryButtonStyle = severity === 'normal' ? 'primary' : 'danger'

    return (
      <React.Fragment>
        { trigger({ onClick: this.handleTriggerClick }) }
        <MessageDialog
          id={id}
          show={this.state.show}
          onHide={this.handleClose}
          primaryAction={this.handleDelete}
          secondaryAction={this.handleClose}
          primaryActionButtonBsStyle={primaryButtonStyle}
          primaryActionButtonContent={msg.delete()}
          secondaryActionButtonContent={msg.cancel()}
          title={msg.confirmDelete()}
          icon={icon}
          primaryContent={<div id={`${id}-lead`} className='lead'>{primary}</div>}
          secondaryContent={secondary}
        />
      </React.Fragment>
    )
  }
}

DeleteConfirmationModal.propTypes = {
  id: PropTypes.string.isRequired,
  trigger: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  severity: PropTypes.oneOf([ 'normal', 'danger' ]),
  msg: PropTypes.object.isRequired,
}

export default withMsg(DeleteConfirmationModal)
