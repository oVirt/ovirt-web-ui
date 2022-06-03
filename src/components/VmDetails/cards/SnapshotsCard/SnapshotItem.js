import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import {
  Tooltip as PFTooltip,
} from '@patternfly/react-core'

import itemStyle from '../../itemListStyle.css'
import style from './style.css'

import { withMsg } from '_/intl'
import RestoreConfirmationModal from './RestoreConfirmationModal'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import SnapshotDetail from './SnapshotDetail'
import { deleteVmSnapshot } from './actions'
import { formatHowLongAgo } from '_/utils/format'
import { getMinimizedString, escapeHtml } from '../../../utils'
import { Tooltip, InfoTooltip } from '_/components/tooltips'
import { CheckCircleIcon, EyeIcon, LockIcon, PlayIcon, TrashIcon } from '@patternfly/react-icons/dist/esm/icons'
const MAX_DESCRIPTION_SIZE = 50

const SnapshotAction = ({ children, className, disabled, id, onClick }) => {
  return (
    <a
      id={id}
      onClick={disabled ? () => {} : onClick}
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

const StatusTooltip = ({ icon: TheIcon, text, id, placement, className }) => {
  return (
    <PFTooltip id={id} content={text} position={placement}>
      <a className={className}><TheIcon/></a>
    </PFTooltip>
  )
}
StatusTooltip.propTypes = {
  icon: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  placement: PropTypes.string.isRequired,
  className: PropTypes.string,
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
    const buttons = []

    // Snapshot actions
    const isActionsDisabled = !this.props.isEditing || this.props.snapshot.get('status') === 'locked'
    const isRestoreDisabled = isActionsDisabled || !this.props.isVmDown || this.props.isPoolVm
    if (!this.props.snapshot.get('isActive')) {
      // Info popover
      buttons.push(
        <SnapshotDetail
          key='detail'
          id={`${this.props.id}-info-popover`}
          snapshot={this.props.snapshot}
          vmId={this.props.vmId}
          isPoolVm={this.props.isPoolVm}
          msg={msg}
          locale={locale}
          position={this.state.isMobile || this.state.isTablet ? 'top' : 'left'}
        >
          <a id={`${this.props.id}-info`} className={itemStyle['item-action']}>
            <InfoTooltip
              id={`${this.props.id}-info-tt`}
              tooltip={msg.details()}
              className={style.black}
            />
          </a>
        </SnapshotDetail >
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
              <SnapshotAction key='restore' id={`${this.props.id}-restore`} onClick={onClick} disabled={isRestoreDisabled} className={itemStyle['item-action']}>
                <Tooltip id={`${this.props.id}-restore-tt`} tooltip={msg.snapshotRestore()}>
                  <PlayIcon className={isRestoreDisabled ? '' : style.black}/>
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
            severity='danger'
            title={msg.permanentlyDeleteSnapshot()}
            onDelete={this.props.onSnapshotDelete}
            trigger={({ onClick }) => (
              <SnapshotAction key='delete' id={`${this.props.id}-delete`} disabled={isActionsDisabled} onClick={onClick} className={itemStyle['item-action']}>
                <Tooltip id={`${this.props.id}-delete-tt`} tooltip={msg.snapshotDelete()}>
                  <TrashIcon className={isActionsDisabled ? '' : style.red}/>
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
          statusIcon = <StatusTooltip icon={LockIcon} text={`${status} ${msg.locked()}`} id={tooltipId} placement={tooltipPlacement} />
          break
        case 'in_preview':
          statusIcon = <StatusTooltip icon={EyeIcon} text={`${status} ${msg.inPreview()}`} id={tooltipId} placement={tooltipPlacement} />
          break
        case 'ok':
          statusIcon = <StatusTooltip icon={CheckCircleIcon} text={`${status} ${msg.ok()}`} className={style.green} id={tooltipId} placement={tooltipPlacement} />
          break
      }
    }

    return (
      <div className={itemStyle['item-row']} id={this.props.id}>
        <span className={itemStyle['item-row-status']} id={`${this.props.id}-status-icon`}>{statusIcon}</span>
        <span className={itemStyle['item-row-info']} id={`${this.props.id}-description`}>
          <span className={style['snapshot-name-info']}>{getMinimizedString(this.props.snapshot.get('description'), MAX_DESCRIPTION_SIZE)}</span>
          <span className={itemStyle['item-extra_info']} id={`${this.props.id}-time`}>{`(${formatHowLongAgo(this.props.snapshot.get('date'))})`}</span>
        </span>
        <span className={itemStyle['item-row-actions']} id={`${this.props.id}-actions`}>{ buttons }</span>
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
