import React from 'react'
import PropsTypes from 'prop-types'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import { Icon, MessageDialog } from 'patternfly-react'
import { msg } from '../../../../intl'
import { restoreVmSnapshot } from './actions'
import { getMinimizedString, escapeHtml } from '../../../utils'

const MAX_DESCRIPTION_SIZE = 150

class RestoreConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showModal: false }
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.handleRestore = this.handleRestore.bind(this)
  }

  open () {
    this.setState({ showModal: true })
  }

  close () {
    this.setState({ showModal: false })
  }

  handleRestore () {
    this.props.onRestore()
    this.close()
  }

  render () {
    const { snapshot, trigger, snapshots, disabled } = this.props

    const icon = <Icon type='pf' name='warning-triangle-o' />
    const clonedTrigger = React.cloneElement(trigger, { onClick: this.open, disabled })
    const snapshotsThatWillBeDeleted = snapshots.filter((s) => s.get('date') > snapshot.get('date'))
    const minDescription = escapeHtml(getMinimizedString(snapshot.get('description'), MAX_DESCRIPTION_SIZE))

    return (
      <React.Fragment>
        {clonedTrigger}
        <MessageDialog
          show={this.state.showModal}
          onHide={this.close}
          primaryAction={this.handleRestore}
          secondaryAction={this.close}
          primaryActionButtonContent={msg.restore()}
          secondaryActionButtonContent={msg.cancel()}
          title={msg.confirmRestore()}
          icon={icon}
          primaryContent={
            <div
              className='lead'
              dangerouslySetInnerHTML={{
                __html: msg.areYouSureYouWantToRestoreSnapshot({ snapshotName: `"<strong>${minDescription}</strong>"` }),
              }}
            />}
          secondaryContent={
            snapshotsThatWillBeDeleted.size > 0 &&
            <div>
              {msg.nextSnapshotsWillBeDeleted()}
              {snapshotsThatWillBeDeleted.map((s) => <div key={s.get('date')}>{s.get('description')}</div>)}
            </div>
          }
        />
      </React.Fragment>
    )
  }
}

RestoreConfirmationModal.propTypes = {
  snapshot: PropsTypes.object.isRequired,
  vmId: PropsTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  snapshots: PropsTypes.object.isRequired,
  trigger: PropsTypes.node.isRequired,
  disabled: PropsTypes.bool,
  onRestore: PropsTypes.func.isRequired,
}

export default connect(
  (state, { vmId }) => ({
    snapshots: state.vms.getIn([ 'vms', vmId, 'snapshots' ], Immutable.fromJS([])).filter((s) => !s.get('isActive')),
  }),
  (dispatch, { vmId, snapshot }) => ({
    onRestore: () => dispatch(restoreVmSnapshot({ vmId, snapshotId: snapshot.get('id') })),
  })
)(RestoreConfirmationModal)
