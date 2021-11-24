import React from 'react'
import PropsTypes from 'prop-types'
import { connect } from 'react-redux'
import Immutable from 'immutable'

import { withMsg } from '_/intl'
import { getMinimizedString, escapeHtml } from '_/components/utils'
import { restoreVmSnapshot } from './actions'
import ConfirmationModal from '_/components/VmActions/ConfirmationModal'

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
    const { snapshot, trigger, snapshots, id, msg } = this.props

    const snapshotsThatWillBeDeleted = snapshots.filter((s) => s.get('date') > snapshot.get('date'))
    const minDescription = escapeHtml(getMinimizedString(snapshot.get('description'), MAX_DESCRIPTION_SIZE))

    return (
      <>
        { trigger({ onClick: this.open })}
        <ConfirmationModal
          id={id}
          show={this.state.showModal}
          onClose={this.close}
          title={msg.confirmRestore()}
          body={(
            <>
              <div
                id={`${id}-lead`}
                className='lead'
                dangerouslySetInnerHTML={{
                  __html: msg.areYouSureYouWantToRestoreSnapshot({ snapshotName: `"<strong>${minDescription}</strong>"` }),
                }}
              />
              { snapshotsThatWillBeDeleted.size > 0 && (
                <div id={`${id}-secondary`}>
                  {msg.nextSnapshotsWillBeDeleted()}
                  {snapshotsThatWillBeDeleted.map((s) => <div key={s.get('date')}>{s.get('description')}</div>)}
                </div>
              )}
            </>
          )}
          confirm={{ onClick: this.handleRestore, title: msg.restore() }}
        />
      </>
    )
  }
}

RestoreConfirmationModal.propTypes = {
  id: PropsTypes.string.isRequired,
  snapshot: PropsTypes.object.isRequired,
  vmId: PropsTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  trigger: PropsTypes.func.isRequired,

  snapshots: PropsTypes.object.isRequired,
  onRestore: PropsTypes.func.isRequired,
  msg: PropsTypes.object.isRequired,
}

export default connect(
  (state, { vmId }) => ({
    snapshots: state.vms.getIn(['vms', vmId, 'snapshots'], Immutable.fromJS([])).filter((s) => !s.get('isActive')),
  }),
  (dispatch, { vmId, snapshot }) => ({
    onRestore: () => dispatch(restoreVmSnapshot({ vmId, snapshotId: snapshot.get('id') })),
  })
)(withMsg(RestoreConfirmationModal))
