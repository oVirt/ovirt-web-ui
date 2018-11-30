import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { createDiskForVm, editDiskOnVm, removeDisk } from '../../../../actions'

import { msg } from '_/intl'
import { isNumber } from '_/utils'
import { sortDisksForDisplay } from '../../../VmDisks/utils'
import { maskForElementId } from '../../../utils'

import { Icon } from 'patternfly-react'
import BaseCard from '../../BaseCard'
import { Grid, Row, Col } from '../../GridComponents'
import DiskImageEditor from './DiskImageEditor'
import DiskListItem from './DiskListItem'

import itemStyle from '../../itemListStyle.css'
import style from './style.css'

function filterStorageDomains (vm, clusters, storageDomains) {
  const clusterId = vm.getIn(['cluster', 'id'])
  const dataCenterId = clusters && clusters.getIn([clusterId, 'dataCenterId'])

  return storageDomains
    .filter(sd =>
      sd.get('type') === 'data' &&
      sd.getIn(['statusPerDataCenter', dataCenterId]) === 'active'
    )
    // TODO: Add storage domain permission/permit checking and filtering as necessary.
    .toList()
}

function suggestDiskName (vm) {
  const regex = new RegExp(`${vm.get('name')}_Disk(\\d+)`)
  let biggestNumber = 0

  vm.get('disks', []).forEach(disk => {
    const [, number] = regex.exec(disk.get('name')) || []
    if (isNumber(number)) {
      biggestNumber = Math.max(biggestNumber, parseInt(number, 0))
    }
  })

  return vm.get('name') + '_Disk' + (biggestNumber + 1)
}

/*
 * Suggest a storage domain to use for new disks based on what storage domains are used by the
 * disks already attached the the VM.
 */
function suggestStorageDomain (vm, clusters, storageDomains) {
  const filtered = filterStorageDomains(vm, clusters, storageDomains).map(sd => sd.get('id'))

  if (vm.get('disks') && vm.get('disks').length === 0) {
    return filtered[0]
  }

  let mostCommon = { id: '', count: 0 }
  vm.get('disks')
    .map(disk => disk.get('storageDomainId'))
    .filter(sdId => filtered.includes(sdId))
    .sort((a, b) => storageDomains.get(a).get('name').localeCompare(storageDomains.get(b).get('name')))
    .reduce((acc, sdId) => acc.set(sdId, (acc.get(sdId) || 0) + 1), new Map())
    .forEach((count, sdId) => {
      if (count > mostCommon.count) {
        mostCommon = { id: sdId, count }
      }
    })

  return mostCommon.id
}

/**
 * List of disks attached a VM, a few bits of info about each, and allow an edit
 * mode to created, edit and delete VM disks.
 */
class DisksCard extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      suggestedDiskName: suggestDiskName(props.vm),
      suggestedStorageDomain: suggestStorageDomain(props.vm, props.clusters, props.storageDomains),
      filteredStorageDomainList: filterStorageDomains(props.vm, props.clusters, props.storageDomains),
    }

    this.onCreateConfirm = this.onCreateConfirm.bind(this)
    this.onEditConfirm = this.onEditConfirm.bind(this)
    this.onDeleteConfirm = this.onDeleteConfirm.bind(this)
  }

  componentDidUpdate (prevProps, prevState) {
    const { vm, clusters, storageDomains } = this.props
    const changes = {}

    if (prevProps.vm !== vm) {
      changes.suggestedDiskName = suggestDiskName(vm)
      changes.suggestedStorageDomain = suggestStorageDomain(vm, clusters, storageDomains)
    }

    if (prevProps.vm !== vm || prevProps.storageDomains !== storageDomains) {
      changes.filteredStorageDomainList = filterStorageDomains(vm, clusters, storageDomains)
    }

    if (Object.values(changes).length > 0) {
      this.setState(changes) // eslint-disable-line react/no-did-update-set-state
    }
  }

  onCreateConfirm (vmId, disk) {
    this.props.addDisk({ vmId, disk })
  }

  onEditConfirm (vmId, disk) {
    this.props.editDisk({ vmId, disk })
  }

  onDeleteConfirm (vmId, diskId) {
    this.props.deleteDisk({ diskId, vmId })
  }

  render () {
    const { vm, onEditChange } = this.props
    const { suggestedDiskName, suggestedStorageDomain, filteredStorageDomainList } = this.state

    const idPrefix = 'vmdetail-disks'
    const canEditTheCard =
      vm.get('canUserEditVm') &&
      vm.getIn(['pool', 'id']) === undefined

    const canCreateDisks = true // TODO: Better creation condition / Permission check?
    const canDeleteDisks = vm.get('status') === 'down' // TODO: Permission check?
    const canEditDisks = true // TODO: Better edit conditions / Permission check?

    const diskList = sortDisksForDisplay(vm.get('disks')) // ImmutableJS List()

    return (
      <BaseCard
        idPrefix={idPrefix}
        icon={{ type: 'pf', name: 'storage-domain' }}
        title={msg.disks()}
        editTooltip={msg.disksCardEditTooltip({ vmId: vm.get('id') })}
        editable={canEditTheCard}
        itemCount={diskList.size}
        onStartEdit={() => { onEditChange(true) }}
        onCancel={() => { onEditChange(false) }}
        onSave={() => { onEditChange(false) }}
      >
        {({ isEditing }) =>
          <Grid className={style['disks-container']}>
            { isEditing && canCreateDisks &&
              <Row key={`${vm.get('id')}-disk-add`}>
                <Col>
                  <DiskImageEditor
                    idPrefix={`${idPrefix}-new-disk`}
                    vm={vm}
                    suggestedName={suggestedDiskName}
                    suggestedStorageDomain={suggestedStorageDomain}
                    storageDomainList={filteredStorageDomainList}
                    onSave={this.onCreateConfirm}
                    trigger={
                      <div className={itemStyle['create-block']}>
                        <a href='#' id={`${idPrefix}-new-disk-action`}>
                          <Icon className={itemStyle['create-icon']} type='fa' name='plus' />
                          <span className={itemStyle['create-text']} >{msg.diskActionCreateNew()}</span>
                        </a>
                      </div>
                    }
                  />
                </Col>
              </Row>
            }

            { diskList.size === 0 &&
              <Row>
                <Col>
                  <div className={itemStyle['no-items']} id={`${idPrefix}-no-disks`}>{msg.noDisks()}</div>
                </Col>
              </Row>
            }

            { diskList.size > 0 && diskList.map(disk =>
              <Row key={disk.get('id')}>
                <Col style={{ display: 'block' }}>
                  <DiskListItem
                    idPrefix={`${idPrefix}-${maskForElementId(disk.get('name'))}`}
                    vm={vm}
                    disk={disk}
                    storageDomainList={filteredStorageDomainList}
                    isEditing={isEditing}
                    canDeleteDisks={canDeleteDisks}
                    canEditDisks={canEditDisks}
                    onEdit={this.onEditConfirm}
                    onDelete={this.onDeleteConfirm}
                  />
                </Col>
              </Row>
            )}
          </Grid>
        }
      </BaseCard>
    )
  }
}
DisksCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,

  storageDomains: PropTypes.object.isRequired, // Map<id, storageDomain>
  clusters: PropTypes.object.isRequired,

  addDisk: PropTypes.func.isRequired,
  editDisk: PropTypes.func.isRequired,
  deleteDisk: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    storageDomains: state.storageDomains,
    clusters: state.clusters,
  }),
  (dispatch) => ({
    addDisk: ({ vmId, disk }) => dispatch(createDiskForVm({ vmId, disk })),
    editDisk: ({ vmId, disk }) => dispatch(editDiskOnVm({ vmId, disk })),
    deleteDisk: ({ vmId, diskId }) => dispatch(removeDisk({ diskId, vmToRefreshId: vmId })),
  })
)(DisksCard)
