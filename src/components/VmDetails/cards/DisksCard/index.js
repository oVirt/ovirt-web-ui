import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Label } from 'patternfly-react'

import { msg } from '../../../../intl'
import { convertValue, round } from '../../../../utils'
import { sortDisksForDisplay } from '../../../VmDisks/utils'

import BaseCard from '../../BaseCard'
import { Grid, Row, Col } from '../../GridComponents'

import style from './style.css'

/**
 * List of disks attached a VM
 */
const DisksCard = ({ vm, onEditChange }) => {
  const disksList = sortDisksForDisplay(vm.get('disks'))
    .map(disk => {
      const { unit, value } = convertValue('B', disk.get('provisionedSize'))
      return {
        id: disk.get('id'),
        name: disk.get('name'),
        bootable: disk.get('bootable'),
        size: {
          unit,
          value: round(value, 1),
        },
      }
    })
    .toJS()

  const idPrefix = 'vmdetail-disks'

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'storage-domain' }}
      title='Disks'
      editTooltip={`Edit Disks for ${vm.get('id')}`}
      editable={false}
      idPrefix={idPrefix}
      itemCount={disksList.length}
      onStartEdit={() => { onEditChange(true) }}
      onCancel={() => { onEditChange(false) }}
      onSave={() => { onEditChange(false) }}
    >
      {({ isEditing }) => <React.Fragment>
        { disksList.length === 0 &&
          <div className={style['no-disks']} id={`${idPrefix}-no-disks`}>{msg.noDisks()}</div>
        }
        { disksList.length > 0 &&
        <Grid classname={style['disks-container']}>
          {disksList.map((disk, index) =>
            <Row key={disk.id} id={`${idPrefix}-${disk.name}-${index}`}>
              <Col>
                <div>
                  <span id={`${idPrefix}-${disk.name}-${index}-name`}>{disk.name}</span>
                  <span className={style['size-info']} id={`${idPrefix}-${disk.name}-${index}-info`}>({disk.size.value} {disk.size.unit})</span>
                  { disk.bootable && <Label bsStyle='info' className={style['bootable-label']} id={`${idPrefix}-${disk.name}-${index}-bootable`}>bootable</Label> }
                </div>
              </Col>
            </Row>
          )}
        </Grid>
        }
      </React.Fragment>}
    </BaseCard>
  )
}
DisksCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vnicProfiles: state.vnicProfiles,
  })
)(DisksCard)
