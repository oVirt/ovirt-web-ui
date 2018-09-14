import React from 'react'
import PropsTypes from 'prop-types'
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
    const { children, trigger, disabled } = this.props

    const icon = <Icon type='pf' name='warning-triangle-o' />
    return (
      <React.Fragment>
        {React.cloneElement(trigger, { onClick: () => this.setState({ show: true }), disabled })}
        <MessageDialog
          show={this.state.show}
          onHide={this.handleClose}
          primaryAction={this.handleDelete}
          secondaryAction={this.handleClose}
          primaryActionButtonContent={msg.delete()}
          secondaryActionButtonContent={msg.cancel()}
          title={msg.confirmDelete()}
          icon={icon}
          primaryContent={<p className='lead'>{ children }</p>}
        />
      </React.Fragment>
    )
  }
}

DeleteConfirmationModal.propTypes = {
  trigger: PropsTypes.node.isRequired,
  disabled: PropsTypes.bool,
  children: PropsTypes.node.isRequired,
  onDelete: PropsTypes.func.isRequired,
  onClose: PropsTypes.func,
}

export default DeleteConfirmationModal
