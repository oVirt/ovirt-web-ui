import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import {
  Icon,
  OverlayTrigger,
  Tooltip as PFTooltip,
  noop,
} from 'patternfly-react'

import style from './style.css'

import { withMsg } from '_/intl'
import RestoreConfirmationModal from './RestoreConfirmationModal'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import SnapshotDetail from './SnapshotDetail'
import { deleteVmSnapshot } from './actions'
import { formatHowLongAgo } from '_/utils/format'
import { getMinimizedString, escapeHtml } from '../../../utils'
import { Tooltip, InfoTooltip } from '_/components/tooltips'
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
  return <OverlayTrigger overlay={<PFTooltip id={id}>{text}</PFTooltip>} placement={placement} trigger={['hover', 'focus']}>
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
    const { msg, locale } = this.props
    let statusIcon = null
    let buttons = []

    // Snapshot actions
    const isActionsDisabled = !this.props.isEditing || this.props.snapshot.get('status') === 'locked'
    const isRestoreDisabled = isActionsDisabled || !this.props.isVmDown || this.props.isPoolVm
    if (!this.props.snapshot.get('isActive')) {
      // Info popover
      buttons.push(
        <OverlayTrigger
          overlay={
            <SnapshotDetail key='detail'
              id={`${this.props.id}-info-popover`}
              snapshot={this.props.snapshot}
              vmId={this.props.vmId}
              restoreDisabled={isRestoreDisabled}
              isPoolVm={this.props.isPoolVm}
              msg={msg}
              locale={locale}
            />
          }
          placement={this.state.isMobile || this.state.isTablet ? 'top' : 'left'}
          trigger='click'
          rootClose
          key='info'
        >
          <a id={`${this.props.id}-info`}>
            <InfoTooltip
              id={`${this.props.id}-info-tt`}
              tooltip={msg.details()}
            />
          </a>
        </OverlayTrigger>
      )

      if (!this.props.hideActions) {
        // Restore action
        buttons.push(
          <RestoreConfirmationModal
            key='restore'
            id={`${this.props.id}-restore-modal`}
            snapshot={this.props.snapshot}
            vmId={this.props.vmId}
            trigger={({ onClick }) => (
              <SnapshotAction key='restore' id={`${this.props.id}-restore`} onClick={onClick} disabled={isRestoreDisabled}>
                <Tooltip id={`${this.props.id}-restore-tt`} tooltip={msg.snapshotRestore()}>
                  <Icon type='fa' name='play-circle' />
                </Tooltip>
              </SnapshotAction>
            )}
          />
        )

        // Delete action
        buttons.push(
          <DeleteConfirmationModal
            key='delete'
            id={`${this.props.id}-delete-modal`}
            onDelete={this.props.onSnapshotDelete}
            trigger={({ onClick }) => (
              <SnapshotAction key='delete' id={`${this.props.id}-delete`} disabled={isActionsDisabled} onClick={onClick}>
                <Tooltip id={`${this.props.id}-delete-tt`} tooltip={msg.snapshotDelete()}>
                  <Icon type='pf' name='delete' />
                </Tooltip>
              </SnapshotAction>
            )}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: msg.areYouSureYouWantToDeleteSnapshot({
                  snapshotName: `"<strong>${escapeHtml(this.props.snapshot.get('description'))}</strong>"`,
                }),
              }}
            />
            <div>{msg.thisOperationCantBeUndone()}</div>
          </DeleteConfirmationModal>
        )
      }

      // Status tooltip
      const tooltipId = `${this.props.id}-status-icon-${this.props.snapshot.get('status')}`
      const tooltipPlacement = 'top'
      const status = `${msg.status()}:`
      switch (this.props.snapshot.get('status')) {
        case 'locked':
          statusIcon = <StatusTooltip icon={<Icon type='pf' name='locked' />} text={`${status} ${msg.locked()}`} id={tooltipId} placement={tooltipPlacement} />
          break
        case 'in_preview':
          statusIcon = <StatusTooltip icon={<Icon type='fa' name='eye' />} text={`${status} ${msg.inPreview()}`} id={tooltipId} placement={tooltipPlacement} />
          break
        case 'ok':
          statusIcon = <StatusTooltip icon={<Icon type='pf' name='ok' />} text={`${status} ${msg.ok()}`} id={tooltipId} placement={tooltipPlacement} />
          break
      }
    }

    return (
      <div className={style['snapshot-item']} id={this.props.id}>
        <span className={style['snapshot-item-status']} id={`${this.props.id}-status-icon`}>{statusIcon}</span>
        <span className={style['snapshot-item-name']} id={`${this.props.id}-description`}>
          {getMinimizedString(this.props.snapshot.get('description'), MAX_DESCRIPTION_SIZE)}
          <span className={style['snapshot-item-time']} id={`${this.props.id}-time`}>{`(${formatHowLongAgo(this.props.snapshot.get('date'))})`}</span>
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
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  (state, { vmId }) => ({
    isPoolVm: !!state.vms.getIn(['vms', vmId, 'pool', 'id'], false),
  }),
  (dispatch, { vmId, snapshot }) => ({
    onSnapshotDelete: () => dispatch(deleteVmSnapshot({ vmId, snapshotId: snapshot.get('id') })),
  })
)(withMsg(SnapshotItem))
