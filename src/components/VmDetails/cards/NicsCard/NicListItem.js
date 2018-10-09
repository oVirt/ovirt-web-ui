import React from 'react'
import PropTypes from 'prop-types'

import { msg } from '../../../../intl'
import { escapeHtml } from '../../../utils'
import { Grid, Row, Col } from '../../GridComponents'
import itemStyle from '../../itemListStyle.css'
import style from './style.css'

import { Icon, OverlayTrigger, Tooltip } from 'patternfly-react'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import NicEditor from './NicEditor'
import NicLinkStateIcon from './NicLinkStateIcon'

/**
 * Render a single NIC in the list of Nics on the Nics Card.
 *
 * If _edit_ then render the appropriate action buttons linked to provided
 * handler functions.
 */
const NicListItem = ({ nic, vmStatus, vnicProfileList, isEditing, onEdit, onDelete }) => {
  const canEdit = !!onEdit
  const canDelete = !!onDelete

  return <div className={itemStyle['item-row']}>
    {/* Status Column - content width only */}
    <span className={itemStyle['item-row-status']}>
      <NicLinkStateIcon linkState={nic.linked} idSuffix={nic.id} />
    </span>

    {/* Details Column - take the rest of the space */}
    <span className={itemStyle['item-row-info']}>
      <div>
        {nic.name}
        { nic.vnicProfile.id
          ? <span className={style['vnic-info']}>({nic.vnicProfile.name}/{nic.vnicProfile.network})</span>
          : <span className={style['vnic-info']}>[{msg.nicNoVnicAssigned()}]</span>
        }
      </div>
      <Grid>
        <Row>
          <Col cols={6} className={style['ip4-container']}>
            { nic.ipv4.length > 0 &&
              <div>
                {nic.ipv4.map(ip4 => <div key={`${nic.id}-${ip4}`}>{msg.nicIP4()}: {ip4}</div>)}
              </div>
            }
          </Col>
          <Col cols={6} className={style['ip6-container']}>
            { nic.ipv6.length > 0 &&
              <div>
                {nic.ipv6.map(ip6 => <div key={`${nic.id}-${ip6}`}>{msg.nicIP6()}: {ip6}</div>)}
              </div>
            }
          </Col>
        </Row>
      </Grid>
    </span>

    {/* Actions Column (if edit) - content width, no wrapping */}
    { isEditing &&
    <span className={itemStyle['item-row-actions']}>
      { canEdit &&
        <NicEditor
          nic={nic}
          vmStatus={vmStatus}
          vnicProfileList={vnicProfileList}
          onSave={onEdit}
          trigger={
            <OverlayTrigger
              overlay={<Tooltip id={`nic-edit-tooltip-${nic.id}`}>{msg.nicEditTooltip()}</Tooltip>}
              placement='left'
            >
              <a id={`nic-edit-action-${nic.id}`} className={itemStyle['item-action']}>
                <Icon type='pf' name='edit' />
              </a>
            </OverlayTrigger>
          }
        />
      }
      { !canEdit &&
        <OverlayTrigger
          overlay={<Tooltip id={`nic-edit-tooltip-${nic.id}`}>{msg.nicEditDisabledTooltip()}</Tooltip>}
          placement='left'
        >
          <Icon
            type='pf'
            name='edit'
            id={`nic-edit-action-${nic.id}`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </OverlayTrigger>
      }

      { canDelete &&
        <DeleteConfirmationModal
          onDelete={() => { onDelete(nic) }}
          trigger={
            <OverlayTrigger
              overlay={<Tooltip id={`nic-delete-tooltip-${nic.id}`}>{msg.nicDeleteTooltip()}</Tooltip>}
              placement='left'
            >
              <a id={`nic-delete-action-${nic.id}`} className={itemStyle['item-action']}>
                <Icon type='pf' name='delete' />
              </a>
            </OverlayTrigger>
          }
        >
          <span
            dangerouslySetInnerHTML={{
              __html: msg.areYouSureYouWantToDeleteNic({
                nicName: `"<strong>${escapeHtml(nic.name)}</strong>"`,
              }),
            }}
          />
        </DeleteConfirmationModal>
      }
      { !canDelete &&
        <OverlayTrigger
          overlay={<Tooltip id={`nic-delete-tooltip-${nic.id}`}>{msg.nicDeleteDisabledTooltip()}</Tooltip>}
          placement='left'
        >
          <Icon
            type='pf'
            name='delete'
            id={`nic-delete-action-${nic.id}`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </OverlayTrigger>
      }
    </span>
    }
  </div>
}
NicListItem.propTypes = {
  nic: PropTypes.object.isRequired,
  vmStatus: PropTypes.string.isRequired,
  vnicProfileList: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,

  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

export default NicListItem
