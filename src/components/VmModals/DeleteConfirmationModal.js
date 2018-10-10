import React from 'react'
import PropTypes from 'prop-types'
import { MessageDialog, Icon } from 'patternfly-react'
import { msg } from '../../intl'

class DeleteConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = { show: false }
    this.handleClose = this.handleClose.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }

  handleClose () {
    this.setState({ show: false })
    this.props.onClose && this.props.onClose()
  }

  handleDelete () {
    this.props.onDelete()
    this.setState({ show: false })
  }

  render () {
    const { children, trigger, disabled, severity = 'normal' } = this.props

    const primary = Array.isArray(children) ? children[0] : children
    const secondary = Array.isArray(children) ? children.slice(1) : undefined

    const icon = severity === 'normal'
      ? <Icon type='pf' name='warning-triangle-o' />
      : <Icon type='pf' name='error-circle-o' />
    const primaryButtonStyle = severity === 'normal' ? 'primary' : 'danger'

    return (
      <React.Fragment>
        {React.cloneElement(trigger, { onClick: () => this.setState({ show: true }), disabled })}
        <MessageDialog
          show={this.state.show}
          onHide={this.handleClose}
          primaryAction={this.handleDelete}
          secondaryAction={this.handleClose}
          primaryActionButtonBsStyle={primaryButtonStyle}
          primaryActionButtonContent={msg.delete()}
          secondaryActionButtonContent={msg.cancel()}
          title={msg.confirmDelete()}
          icon={icon}
          primaryContent={<div className='lead'>{primary}</div>}
          secondaryContent={secondary}
        />
      </React.Fragment>
    )
  }
}

DeleteConfirmationModal.propTypes = {
  trigger: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  severity: PropTypes.oneOf([ 'normal', 'danger' ]),
}

export default DeleteConfirmationModal
