import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { MsgContext } from '_/intl'
import { escapeHtml } from '../../../utils'
import itemStyle from '../../itemListStyle.css'
import style from './style.css'

import { Icon } from 'patternfly-react'
import { Grid, Row, Col } from '_/components/Grid'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import NicEditor from './NicEditor'
import NicLinkStateIcon from './NicLinkStateIcon'
import { Tooltip } from '_/components/tooltips'
import EllipsisValue from '_/components/EllipsisValue'

/**
 * Render a single NIC in the list of Nics on the Nics Card.
 *
 * If _edit_ then render the appropriate action buttons linked to provided
 * handler functions.
 */
const NicListItem = ({ idPrefix, nic, vmStatus, vnicProfileList, isEditing, onEdit, onDelete, showNicIPs }) => {
  const { msg } = useContext(MsgContext)
  const canEdit = !!onEdit
  const canDelete = !!onDelete

  return <div className={itemStyle['item-row']}>
    {/* Status Column - content width only */}
    <span className={itemStyle['item-row-status']}>
      <NicLinkStateIcon linkState={nic.linked} idSuffix={nic.id} />
    </span>

    {/* Details Column - take the rest of the space */}
    <span className={itemStyle['item-row-info']}>
      <div className={style['nics-title']}>
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
          <Col cols={4} wrapExpand className={style['ip4-container']} id={`${idPrefix}-ipv4`}>
            { showNicIPs && nic.ipv4.length > 0 &&
              nic.ipv4.map((ip4, index) =>
                <EllipsisValue
                  tooltip={ip4}
                  key={`${nic.id}-${ip4}-${index}`}
                  id={`${idPrefix}-ipv4-${index}`}
                >
                  {msg.nicIP4()}: {ip4}
                </EllipsisValue>)
            }
          </Col>
          <Col cols={8} wrapExpand className={style['ip6-container']} id={`${idPrefix}-ipv6`}>
            { showNicIPs && nic.ipv6.length > 0 &&
              nic.ipv6.map((ip6, index) =>
                <EllipsisValue
                  tooltip={ip6}
                  key={`${nic.id}-${ip6}-${index}`}
                  id={`${idPrefix}-ipv6-${index}`}
                >
                  {msg.nicIP6()}: {ip6}
                </EllipsisValue>)
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
          trigger={({ onClick }) => (
            <Tooltip id={`${idPrefix}-edit-tooltip`} tooltip={msg.nicEditTooltip()}>
              <a id={`${idPrefix}-edit-action`} className={itemStyle['item-action']} onClick={onClick}>
                <Icon type='pf' name='edit' />
              </a>
            </Tooltip>
          )}
        />
      }
      { !canEdit &&
        <Tooltip id={`${idPrefix}-edit-tooltip-disabled`} tooltip={msg.nicEditDisabledTooltip()}>
          <Icon
            type='pf'
            name='edit'
            id={`${idPrefix}-edit-action-disabled`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </Tooltip>
      }

      { canDelete &&
        <DeleteConfirmationModal
          id={`${idPrefix}-delete-modal`}
          onDelete={() => { onDelete(nic.id) }}
          trigger={({ onClick }) => (
            <Tooltip id={`${idPrefix}-delete-tooltip`} tooltip={msg.nicDeleteTooltip()}>
              <a id={`${idPrefix}-delete-action`} className={itemStyle['item-action']} onClick={onClick}>
                <Icon type='pf' name='delete' />
              </a>
            </Tooltip>
          )}
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
        <Tooltip id={`${idPrefix}-delete-tooltip-disabled`} tooltip={msg.nicDeleteDisabledTooltip()}>
          <Icon
            type='pf'
            name='delete'
            id={`${idPrefix}-delete-action-disabled`}
            className={`${itemStyle['item-action']} ${itemStyle['item-action-disabled']}`}
          />
        </Tooltip>
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
  showNicIPs: PropTypes.bool.isRequired,

  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

export default NicListItem
