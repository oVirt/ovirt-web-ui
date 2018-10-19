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
const NicListItem = ({ idPrefix, nic, vmStatus, vnicProfileList, isEditing, onEdit, onDelete }) => {
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
        <span id={`${idPrefix}-name`}>{nic.name}</span>
        <span className={style['vnic-info']} id={`${idPrefix}-vnic-info`}>
          { nic.vnicProfile.id
            ? `(${nic.vnicProfile.name}/${nic.vnicProfile.network})`
            : `[${msg.nicNoVnicAssigned()}]`
          }
        </span>
      </div>
      <Grid>
        <Row>
          <Col cols={6} className={style['ip4-container']} id={`${idPrefix}-ipv4`}>
            { nic.ipv4.length > 0 &&
              <div>
                {nic.ipv4.map(ip4 => <div key={`${nic.id}-${ip4}`}>{msg.nicIP4()}: {ip4}</div>)}
              </div>
            }
          </Col>
          <Col cols={6} className={style['ip6-container']} id={`${idPrefix}-ipv6`}>
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
    <span className={itemStyle['item-row-actions']} id={`${idPrefix}-actions`}>
      { canEdit &&
        <NicEditor
          idPrefix={`${idPrefix}-edit`}
          nic={nic}
          vmStatus={vmStatus}
          vnicProfileList={vnicProfileList}
          onSave={onEdit}
          trigger={
            <OverlayTrigger
              overlay={<Tooltip id={`${idPrefix}-edit-tooltip`}>{msg.nicEditTooltip()}</Tooltip>}
              placement='left'
            >
              <a id={`${idPrefix}-edit-action`} className={itemStyle['item-action']}>
                <Icon type='pf' name='edit' />
              </a>
            </OverlayTrigger>
          }
        />
      }
      { !canEdit &&
        <OverlayTrigger
          overlay={<Tooltip id={`${idPrefix}-edit-tooltip-disabled`}>{msg.nicEditDisabledTooltip()}</Tooltip>}
          placement='left'
        >
          <Icon
            type='pf'
            name='edit'
            id={`${idPrefix}-edit-action-disabled`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </OverlayTrigger>
      }

      { canDelete &&
        <DeleteConfirmationModal
          id={`${idPrefix}-delete-modal`}
          onDelete={() => { onDelete(nic.id) }}
          trigger={
            <OverlayTrigger
              overlay={<Tooltip id={`${idPrefix}-delete-tooltip`}>{msg.nicDeleteTooltip()}</Tooltip>}
              placement='left'
            >
              <a id={`${idPrefix}-delete-action`} className={itemStyle['item-action']}>
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
          overlay={<Tooltip id={`${idPrefix}-delete-tooltip-disabled`}>{msg.nicDeleteDisabledTooltip()}</Tooltip>}
          placement='left'
        >
          <Icon
            type='pf'
            name='delete'
            id={`${idPrefix}-delete-action-disabled`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </OverlayTrigger>
      }
    </span>
    }
  </div>
}
NicListItem.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  nic: PropTypes.object.isRequired,
  vmStatus: PropTypes.string.isRequired,
  vnicProfileList: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,

  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

export default NicListItem
