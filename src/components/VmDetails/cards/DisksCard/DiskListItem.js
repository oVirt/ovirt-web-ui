import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { msg } from '../../../../intl'
import { convertValue, round } from '../../../../utils'
import { PendingTaskTypes } from '../../../../reducers/pendingTasks'

import { escapeHtml } from '../../../utils'
import itemStyle from '../../itemListStyle.css'
import style from './style.css'

import { Icon, OverlayTrigger, Tooltip, Label } from 'patternfly-react'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import DiskStateIcon from './DiskStateIcon'
import DiskImageEditor from './DiskImageEditor'

function isDiskBeingDeleted (diskId, pendingTasks) {
  return !!pendingTasks.find(
    task => task.type === PendingTaskTypes.DISK_REMOVAL && task.diskId === diskId
  )
}

/**
 * Render a single Disk in the list of Disks on the Disks Card.
 *
 * If _isEditing_ then render the appropriate action buttons linked to provided
 * handler functions.  If the action callbacks are not defined, they are assumed to
 * be disabled/disallowed and will be rendered as such.
 */
const DiskListItem = ({
  idPrefix, vm, disk, storageDomainList,
  isEditing, isDiskBeingDeleted, canDeleteDisks, canEditDisks,
  onEdit, onDelete,
}) => {
  const size = disk.get('type') === 'lun' ? disk.get('lunSize') : disk.get('provisionedSize')
  const { unit, value } = convertValue('B', size)
  const isLocked = disk.get('status') === 'locked'

  const view = {
    id: disk.get('id'),
    name: disk.get('name'),
    bootable: disk.get('bootable'),
    state: (isLocked && 'locked') || (disk.get('active') && 'active') || 'inactive',
    size: {
      unit,
      value: round(value, 1),
    },
  }

  const canDelete = canDeleteDisks && !isDiskBeingDeleted && !isLocked
  const canEdit = canEditDisks && !isDiskBeingDeleted && !isLocked

  return <div className={itemStyle['item-row']}>
    {/* No Disk Status Column (could be the disk's active/inactive status) */}
    <div className={itemStyle['item-row-status']}>
      <DiskStateIcon diskState={view.state} idPrefix={idPrefix} />
    </div>

    {/* Details Column - take the rest of the space */}
    <div className={itemStyle['item-row-info']}>
      <span id={`${idPrefix}-name`} className={style['name-info']}>
        {view.name}
      </span>
      <span id={`${idPrefix}-size`} className={style['size-info']}>
        ({view.size.value} {view.size.unit})
      </span>
      { view.bootable &&
        <Label id={`${idPrefix}-bootable`} className={style['disk-label']} bsStyle='info'>
          { msg.diskLabelBootable() }
        </Label>
      }
    </div>

    {/* Actions Column (if edit) - content width, no wrapping */}
    { isEditing &&
    <div id={`${idPrefix}-actions`} className={itemStyle['item-row-actions']}>
      { canEdit &&
        <DiskImageEditor
          idPrefix={`${idPrefix}-edit-disk`}
          vm={vm}
          disk={disk}
          storageDomainList={storageDomainList}
          onSave={onEdit}
          trigger={
            <OverlayTrigger
              overlay={<Tooltip id={`${idPrefix}-action-edit-tooltip`}>{msg.diskEditTooltip()}</Tooltip>}
              placement='left'
            >
              <a id={`${idPrefix}-action-edit`} className={itemStyle['item-action']}>
                <Icon type='pf' name='edit' />
              </a>
            </OverlayTrigger>
          }
        />
      }
      { !canEdit &&
        <OverlayTrigger
          overlay={<Tooltip id={`${idPrefix}-action-edit-tooltip-disabled`}>{msg.diskEditDisabledTooltip()}</Tooltip>}
          placement='left'
        >
          <Icon
            type='pf'
            name='edit'
            id={`${idPrefix}-action-edit-disabled`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </OverlayTrigger>
      }

      { canDelete &&
        <DeleteConfirmationModal
          id={`${idPrefix}-delete-modal`}
          severity='danger'
          onDelete={() => { onDelete(vm.get('id'), view.id) }}
          trigger={
            <OverlayTrigger
              overlay={<Tooltip id={`${idPrefix}-action-delete-tooltip`}>{msg.diskDeleteTooltip()}</Tooltip>}
              placement='left'
            >
              <a id={`${idPrefix}-action-delete`} className={itemStyle['item-action']}>
                <Icon type='pf' name='delete' />
              </a>
            </OverlayTrigger>
          }
        >
          <span
            dangerouslySetInnerHTML={{
              __html: msg.areYouSureYouWantToDeleteDisk({
                diskName: `"<strong>${escapeHtml(view.name)}</strong>"`,
              }),
            }}
          />
          <div>{msg.thisOperationCantBeUndone()}</div>
        </DeleteConfirmationModal>
      }
      { !canDelete &&
        <OverlayTrigger
          overlay={<Tooltip id={`${idPrefix}-action-delete-tooltip-disabled`}>{msg.diskDeleteDisabledTooltip()}</Tooltip>}
          placement='left'
        >
          <Icon
            type='pf'
            name='delete'
            id={`${idPrefix}-action-delete-disabled`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </OverlayTrigger>
      }
    </div>
    }
  </div>
}
DiskListItem.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  disk: PropTypes.object.isRequired, // ImmutableJS Map
  storageDomainList: PropTypes.object.isRequired,

  isEditing: PropTypes.bool.isRequired,
  isDiskBeingDeleted: PropTypes.bool.isRequired,
  canDeleteDisks: PropTypes.bool.isRequired,
  canEditDisks: PropTypes.bool.isRequired,

  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

export default connect(
  (state, { disk }) => ({
    isDiskBeingDeleted: isDiskBeingDeleted(disk.get('id'), state.pendingTasks),
  })
)(DiskListItem)
