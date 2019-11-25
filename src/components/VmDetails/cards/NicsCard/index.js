import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Icon } from 'patternfly-react'

import { msg } from '_/intl'
import { isNumber } from '_/utils'
import { addVmNic, deleteVmNic, editVmNic } from '_/actions'

import { Grid, Row, Col } from '_/components/Grid'
import BaseCard from '../../BaseCard'

import itemStyle from '../../itemListStyle.css'
import style from './style.css'
import baseStyle from '../../style.css'
import NicEditor from './NicEditor'
import NicListItem from './NicListItem'

/*
 * Filter the set of vNIC profiles to display to the user such that:
 *   - each vNIC is in the same data center as the VM
 *   - each vNIC's network is available on the same cluster as the VM
 */
function filterVnicProfiles (vm, clusters, vnicProfiles) {
  const clusterId = vm.getIn(['cluster', 'id'])
  const clusterNetworks = clusters.getIn([clusterId, 'networks'])
  const dataCenterId = clusters.getIn([clusterId, 'dataCenterId'])

  return vnicProfiles
    .filter(vnic =>
      vnic.get('dataCenterId') === dataCenterId &&
      clusterNetworks.contains(vnic.getIn(['network', 'id'])) &&
      vnic.get('canUserUseProfile')
    )
    .toList()
}

/*
 * Search the VM's current NIC names and return the next unused numbered NIC name.
 */
function findNextNicName (vm) {
  let biggestNumber = 0

  vm.get('nics').forEach(nic => {
    const [, number] = /nic(\d+)/.exec(nic.get('name')) || []
    if (isNumber(number)) {
      biggestNumber = Math.max(biggestNumber, parseInt(number, 10))
    }
  })

  return `nic${biggestNumber + 1}`
}

/**
 * List of NICs connected to a VM and provide creation of NICs, editing NICs and
 * deleting NICs.
 */
class NicsCard extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      nextNicName: findNextNicName(props.vm),
      filteredVnicList: filterVnicProfiles(props.vm, props.clusters, props.vnicProfiles),
    }

    this.onCreateConfirm = this.onCreateConfirm.bind(this)
    this.onEditConfirm = this.onEditConfirm.bind(this)
    this.onDeleteConfirm = this.onDeleteConfirm.bind(this)
  }

  /* eslint-disable react/no-did-update-set-state */
  componentDidUpdate (prevProps, prevState) {
    const { vm, clusters, vnicProfiles } = this.props
    const changes = {}

    if (prevProps.vm !== vm) {
      changes.nextNicName = findNextNicName(vm)
    }

    if (prevProps.vm !== vm || prevProps.clusters !== clusters || prevProps.vnicProfiles !== vnicProfiles) {
      changes.filteredVnicList = filterVnicProfiles(vm, clusters, vnicProfiles)
    }

    if (Object.values(changes).length > 0) {
      this.setState(changes)
    }
  }

  onCreateConfirm (nic) {
    this.props.addNic({ nic })
  }

  onEditConfirm (nic) {
    this.props.editNic({ nic })
  }

  onDeleteConfirm (nicId) {
    this.props.deleteNic({ nicId })
  }

  render () {
    const { vm, vnicProfiles, onEditChange } = this.props

    const idPrefix = 'vmdetail-nics'
    const canEditTheCard =
      vm.get('canUserEditVm') &&
      vm.getIn(['pool', 'id']) === undefined

    const vmStatus = vm.get('status')
    const canCreateNic = this.state.filteredVnicList.size > 0

    const showNicIPs = vm.get('status') === 'up'
    const nicList = vm.get('nics')
      .sort((a, b) => a.get('name').localeCompare(b.get('name')))
      .map(nic => ({
        id: nic.get('id'),
        name: nic.get('name'),
        plugged: nic.get('plugged'),
        linked: nic.get('linked'),
        interface: nic.get('interface'),
        vnicProfile: {
          id: nic.getIn(['vnicProfile', 'id']),
          name: vnicProfiles.getIn([nic.getIn(['vnicProfile', 'id']), 'name']),
          network: vnicProfiles.getIn([nic.getIn(['vnicProfile', 'id']), 'network', 'name']),
        },
        ipv4: showNicIPs ? nic.get('ipv4').toJS() : [],
        ipv6: showNicIPs ? nic.get('ipv6').toJS() : [],
        canEdit: true, // TODO: True for admins, may need permission checks for users
        canDelete: vmStatus === 'down' || !nic.get('plugged'),
      }))
      .toJS()

    return (
      <BaseCard
        icon={{ type: 'pf', name: 'network' }}
        title={msg.nic()}
        editTooltip={msg.edit()}
        editable={canEditTheCard}
        idPrefix={idPrefix}
        className={baseStyle['cell-card']}
        itemCount={vm.get('nics').size}
        onStartEdit={() => { onEditChange(true) }}
        onCancel={() => { onEditChange(false) }}
        onSave={() => { onEditChange(false) }}
      >
        {({ isEditing }) =>
          <Grid className={style['nics-container']}>
            { isEditing && canCreateNic &&
              <Row key={`${idPrefix}-new`} id={`${idPrefix}-new`}>
                <Col>
                  <NicEditor
                    idPrefix={`${idPrefix}-new`}
                    nextNicName={this.state.nextNicName}
                    vnicProfileList={this.state.filteredVnicList}
                    onSave={this.onCreateConfirm}
                    trigger={
                      <div className={itemStyle['create-block']}>
                        <a href='#' id={`${idPrefix}-new-button`}>
                          <Icon className={itemStyle['create-icon']} type='fa' name='plus' />
                          <span className={itemStyle['create-text']} >{msg.nicActionCreateNew()}</span>
                        </a>
                      </div>
                    }
                  />
                </Col>
              </Row>
            }

            { nicList.length === 0 &&
              <Row>
                <Col>
                  <div className={itemStyle['no-items']} id={`${idPrefix}-no-nics`}>{msg.noNics()}</div>
                </Col>
              </Row>
            }
            { nicList.length > 0 && nicList.map(nic =>
              <Row key={nic.id} id={`${idPrefix}-${nic.name}`}>
                <Col style={{ display: 'block' }}>
                  <NicListItem
                    idPrefix={`${idPrefix}-${nic.name}`}
                    nic={nic}
                    vmStatus={vmStatus}
                    vnicProfileList={this.state.filteredVnicList}
                    isEditing={isEditing}
                    onEdit={nic.canEdit ? this.onEditConfirm : undefined}
                    onDelete={nic.canDelete ? this.onDeleteConfirm : undefined}
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
NicsCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,

  vnicProfiles: PropTypes.object.isRequired, // Map<id, vnic>
  clusters: PropTypes.object.isRequired,

  addNic: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
  editNic: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
  deleteNic: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
}

export default connect(
  (state) => ({
    vnicProfiles: state.vnicProfiles,
    clusters: state.clusters,
  }),
  (dispatch, { vm }) => ({
    addNic: ({ nic }) => dispatch(addVmNic({ vmId: vm.get('id'), nic })),
    editNic: ({ nic }) => dispatch(editVmNic({ vmId: vm.get('id'), nic })),
    deleteNic: ({ nicId }) => dispatch(deleteVmNic({ vmId: vm.get('id'), nicId })),
  })
)(NicsCard)
