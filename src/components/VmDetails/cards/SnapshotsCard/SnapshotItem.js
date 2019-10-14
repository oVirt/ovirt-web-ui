import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import {
  Icon,
  OverlayTrigger,
  Tooltip,
  noop,
} from 'patternfly-react'

import style from './style.css'

import { msg } from '_/intl'
import RestoreConfirmationModal from './RestoreConfirmationModal'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import SnapshotDetail from './SnapshotDetail'
import { deleteVmSnapshot } from './actions'
import { formatDateFromNow } from '_/helpers'
import { getMinimizedString, escapeHtml } from '../../../utils'
import OverlayTooltip from '_/components/OverlayTooltip'
const MAX_DESCRIPTION_SIZE = 50

const SnapshotAction = ({ children, className, disabled, id, onClick }) => {
  return (
    <a
      id={id}
      onClick={disabled ? noop : onClick}
      className={`${className} ${disabled && 'disabled'}`}
    >
      {children}
    </a>
  )
}
SnapshotAction.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func,
}

const StatusTooltip = ({ icon, text, id, placement }) => {
  return <OverlayTrigger overlay={<Tooltip id={id}>{text}</Tooltip>} placement={placement} trigger={['hover', 'focus']}>
    <a>{icon}</a>
  </OverlayTrigger>
}
StatusTooltip.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  placement: PropTypes.string.isRequired,
}

class SnapshotItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isMobile: false,
      isTablet: false,
    }

    this.updateScreenType = this.updateScreenType.bind(this)
  }

  componentDidUpdate () {
    this.updateScreenType()
  }

  updateScreenType () {
    const state = { isMobile: false, isTablet: false }
    if (window.innerWidth <= 768 && window.innerWidth > 600) {
      state.isMobile = false
      state.isTablet = true
    } else if (window.innerWidth <= 600) {
      state.isMobile = true
      state.isTablet = false
    } else {
      state.isMobile = false
      state.isTablet = false
    }

    if (this.state.isMobile !== state.isMobile || this.state.isTablet !== state.isTablet) {
      this.setState(state)
    }
  }

  componentDidMount () {
    window.addEventListener('resize', this.updateScreenType)
    this.updateScreenType()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateScreenType)
  }

  render () {
    let statusIcon = null
    let buttons = []

    // Snapshot actions
    const isActionsDisabled = !this.props.isEditing || this.props.snapshot.get('status') === 'locked'
    const isRestoreDisabled = isActionsDisabled || !this.props.isVmDown || this.props.isPoolVm
    if (!this.props.snapshot.get('isActive')) {
      // Info popover
      buttons.push(<OverlayTrigger
        overlay={
          <SnapshotDetail key='detail' id={`${this.props.id}-info-popover`} snapshot={this.props.snapshot} vmId={this.props.vmId} restoreDisabled={isRestoreDisabled} isPoolVm={this.props.isPoolVm} />
        }
        placement={this.state.isMobile || this.state.isTablet ? 'top' : 'left'}
        trigger='click'
        rootClose
        key='info'
      >
        <a id={`${this.props.id}-info`}>
          <OverlayTooltip placement={this.state.isMobile ? 'right' : 'left'} id={`${this.props.id}-info-tt`} tooltip={msg.details()}>
            <Icon type='pf' name='info' />
          </OverlayTooltip>
        </a>
      </OverlayTrigger>)

      if (!this.props.hideActions) {
        // Restore action
        buttons.push(<RestoreConfirmationModal
          key='restore'
          disabled={isRestoreDisabled}
          snapshot={this.props.snapshot}
          vmId={this.props.vmId}
          id={`${this.props.id}-restore-modal`}
          trigger={
            <SnapshotAction key='restore' id={`${this.props.id}-restore`} >
              <OverlayTooltip placement={this.state.isMobile ? 'right' : 'left'} id={`${this.props.id}-restore-tt`} tooltip={msg.snapshotRestore()}>
                <Icon type='fa' name='play-circle' />
              </OverlayTooltip>
            </SnapshotAction>
          }
        />)
        // Delete action
        buttons.push(<DeleteConfirmationModal
          key='delete'
          disabled={isActionsDisabled}
          id={`${this.props.id}-delete-modal`}
          trigger={
            <SnapshotAction key='delete' id={`${this.props.id}-delete`}>
              <OverlayTooltip placement={this.state.isMobile ? 'right' : 'left'} id={`${this.props.id}-delete-tt`} tooltip={msg.snapshotDelete()}>
                <Icon type='pf' name='delete' />
              </OverlayTooltip>
            </SnapshotAction>
          }
          onDelete={this.props.onSnapshotDelete}
        >
          <div
            dangerouslySetInnerHTML={{
              __html: msg.areYouSureYouWantToDeleteSnapshot({
                snapshotName: `"<strong>${escapeHtml(this.props.snapshot.get('description'))}</strong>"`,
              }),
            }}
          />
          <div>{msg.thisOperationCantBeUndone()}</div>
        </DeleteConfirmationModal>)
      }

      // Status tooltip
      const tooltipId = `${this.props.id}-status-icon-${this.props.snapshot.get('status')}`
      var tooltipPlacement = this.state.isMobile ? 'right' : 'left'
      switch (this.props.snapshot.get('status')) {
        case 'locked':
          statusIcon = <StatusTooltip icon={<Icon type='pf' name='locked' />} text={msg.locked()} id={tooltipId} placement={tooltipPlacement} />
          break
        case 'in_preview':
          statusIcon = <StatusTooltip icon={<Icon type='fa' name='eye' />} text={msg.inPreview()} id={tooltipId} placement={tooltipPlacement} />
          break
        case 'ok':
          statusIcon = <StatusTooltip icon={<Icon type='pf' name='ok' />} text={msg.ok()} id={tooltipId} placement={tooltipPlacement} />
          break
      }
    }

    return (
      <div className={style['snapshot-item']} id={this.props.id}>
        <span className={style['snapshot-item-status']} id={`${this.props.id}-status-icon`}>{statusIcon}</span>
        <span className={style['snapshot-item-name']} id={`${this.props.id}-description`}>
          {getMinimizedString(this.props.snapshot.get('description'), MAX_DESCRIPTION_SIZE)}
          <span className={style['snapshot-item-time']} id={`${this.props.id}-time`}>{`(${formatDateFromNow(this.props.snapshot.get('date'))})`}</span>
        </span>
        <span className={style['snapshot-item-actions']} id={`${this.props.id}-actions`}>{ buttons }</span>
      </div>
    )
  }
}

SnapshotItem.propTypes = {
  snapshot: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  isEditing: PropTypes.bool,
  hideActions: PropTypes.bool,
  isVmDown: PropTypes.bool,
  isPoolVm: PropTypes.bool,
  onSnapshotDelete: PropTypes.func.isRequired,
}

export default connect(
  (state, { vmId }) => ({
    isPoolVm: !!state.vms.getIn(['vms', vmId, 'pool', 'id'], false),
  }),
  (dispatch, { vmId, snapshot }) => ({
    onSnapshotDelete: () => dispatch(deleteVmSnapshot({ vmId, snapshotId: snapshot.get('id') })),
  })
)(SnapshotItem)
