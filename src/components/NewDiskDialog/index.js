import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Modal } from 'patternfly-react'

import { createDiskForVm, cleanNewDiskDialogSubtree } from './actions'
import { msg } from '../../intl'
import SelectBox from '../SelectBox'
import { flatMap, parseGbToBytes } from '../../utils'
import style from './style.css'

class NewDiskDialog extends React.Component {
  constructor (props) {
    super(props)
    props.cleanStoreSubtreeFunction()
    this.state = {
      storageDomainId: undefined,
      alias: undefined,
      sizeGb: '1',
    }

    this.onStorageDomainChange = this.onStorageDomainChange.bind(this)
    this.onCreate = this.onCreate.bind(this)
    this.onAliasChange = this.onAliasChange.bind(this)
    this.onSizeChange = this.onSizeChange.bind(this)
    this.onCancel = this.onCancel.bind(this)
  }

  componentWillMount () {
    this.setState({
      storageDomainId: this.getPreselectedStorageDomainId(),
      alias: this.getNextAliasSuggestion(),
    })
  }

  componentWillReceiveProps (newProps) {
    if (newProps.done) {
      this.props.onClose()
    }
  }

  getDataCenterId () {
    if (!this.props.clusters.clusters || Object.keys(this.props.clusters.clusters).length === 0) {
      // data not yet loaded
      return null
    }
    const clusterId = this.props.vm.cluster.id
    const cluster = Object.values(this.props.clusters.clusters)
      .filter(cluster => cluster.id === clusterId)[0]
    return cluster && cluster.dataCenterId
  }

  /**
   * active in VM's datacenter, data type
   */
  getSuitableStorageDomains () {
    const dataCenterId = this.getDataCenterId()
    if (!dataCenterId) {
      return []
    }
    const storageDomains = Object.values(this.props.storageDomains)
      .filter(storageDomain =>
        storageDomain.statusPerDataCenter[dataCenterId] === 'active' &&
        storageDomain.type === 'data')
    return storageDomains
  }

  getAlreadyUsedSuitableStorageDomainId () {
    if (!this.props.vm.disks) {
      return undefined
    }
    const usedStorageDomainIds = flatMap(Object.values(this.props.vm.disks),
      disk => disk.storageDomainId ? [ disk.storageDomainId ] : [])
    const alreadyUsedStorageDomain = this.getSuitableStorageDomains().find(
      suitableStorageDomain => usedStorageDomainIds.includes(suitableStorageDomain.id))
    return alreadyUsedStorageDomain && alreadyUsedStorageDomain.id
  }

  getPreselectedStorageDomainId () {
    const alreadyUsed = this.getAlreadyUsedSuitableStorageDomainId()
    if (alreadyUsed) {
      return alreadyUsed
    }
    const suitableStorageDomains = this.getSuitableStorageDomains()
    return suitableStorageDomains[0] && suitableStorageDomains[0].id
  }

  getNextAliasSuggestion () {
    const diskNamePrefix = this.props.vm.name + '_Disk'
    const aliasNumbers = this.props.vm.disks
      ? this.props.vm.disks
        .map(disk => disk.name)
        .filter(alias => alias.startsWith(diskNamePrefix))
        .map(alias => Number.parseInt(alias.substr(diskNamePrefix.length)))
        .filter(numericalSuffix => !Number.isNaN(numericalSuffix))
      : []
    if (aliasNumbers.length === 0) {
      return diskNamePrefix + '1'
    }
    const maximalIndex = Math.max(...aliasNumbers)
    return diskNamePrefix + (maximalIndex + 1)
  }

  getDataCenterName () {
    const dataCenterId = this.getDataCenterId()
    if (!dataCenterId) {
      unknownDataCenterName()
    }
    const dataCenter = this.props.dataCenters
      .filter(dataCenter => dataCenter.id === dataCenterId)[0]
    if (!dataCenter) {
      return unknownDataCenterName()
    }
    return dataCenter.name
  }

  /**
   * http://ovirt.github.io/ovirt-engine-api-model/master/#types/disk_interface
   */
  getInterface () {
    const disksOnSelectedStorageDomain = this.state.storageDomainId &&
      this.props.vm.disks &&
      this.props.vm.disks.filter(disk => disk.storageDomainId === this.state.storageDomainId)
    if (!disksOnSelectedStorageDomain || disksOnSelectedStorageDomain.length === 0) {
      return 'virtio_scsi'
    }
    return disksOnSelectedStorageDomain[0].iface
  }

  onAliasChange (event) {
    this.setState({ alias: event.target.value })
  }

  onSizeChange (event) {
    this.setState({ sizeGb: event.target.value })
  }

  onStorageDomainChange (selectedStorageDomainId) {
    this.setState({ storageDomainId: selectedStorageDomainId })
  }

  onCancel () {
    this.props.onClose()
  }

  getSizeBytes () {
    return parseGbToBytes(this.state.sizeGb)
  }

  validate () {
    const sizeValid = !!this.getSizeBytes()
    this.setState({ sizeValidationText: sizeValid ? undefined : msg.diskSizeHasToBeAPositiveInteger() })
    return sizeValid
  }

  onCreate () {
    const valid = this.validate()
    if (!valid) {
      return
    }
    const sizeB = String(this.getSizeBytes())
    const iface = this.getInterface()
    this.props.createDiskFunction(sizeB, this.state.alias, this.state.storageDomainId, iface)
  }

  render () {
    const idPrefix = 'newDiskDialog'
    const serverError = this.props.errorText && (
      <div className={`alert alert-danger ${style.errorAlert}`} id={idPrefix + '-error'}>
        <span className='pficon pficon-error-circle-o' />
        <strong>{msg.errorWhileCreatingNewDisk()}</strong> {this.props.errorText}.
      </div>
    )

    const sizeId = idPrefix + '-size'
    const sizeEditor = (
      <div className={`form-group ${this.state.sizeValidationText ? 'has-error' : ''}`}>
        <label className='col-sm-3 control-label' htmlFor={sizeId}>{msg.size()} (GiB)</label>
        <div className='col-sm-9'>
          <input
            type='number'
            step='1'
            min='1'
            id={sizeId}
            className='form-control'
            onChange={this.onSizeChange}
            value={this.state.sizeGb} />
          {this.state.sizeValidationText && (
            <span className='help-block'>
              {this.state.sizeValidationText}
            </span>
          )}
        </div>
      </div>
    )

    const storageDomainId = idPrefix + '-storageDomain'
    const suitableStorageDomains = this.getSuitableStorageDomains()
    const someStorageDomainSuitable = suitableStorageDomains.length > 0
    const storageDomainsDropdownItems = someStorageDomainSuitable
      ? suitableStorageDomains.reduce(
        (accum, storageDomain) =>
          Object.assign(accum, { [storageDomain.id]: { id: storageDomain.id, value: storageDomain.name } }),
        {})
      : {}
    const storageDomainEditor = (
      <div className={`form-group ${someStorageDomainSuitable ? '' : 'has-error'}`}>
        <label className='col-sm-3 control-label' htmlFor={storageDomainId}>{msg.storageDomain()}</label>
        <div className='col-sm-9'>
          <SelectBox
            className='form-control'
            onChange={this.onStorageDomainChange}
            idPrefix={storageDomainId}
            items={storageDomainsDropdownItems}
            selected={this.state.storageDomainId} />
          {someStorageDomainSuitable || (
            <span className='help-block'>
              {msg.noActiveStorageDomainInDataCenter({ dataCenterName: this.getDataCenterName() })}
            </span>
          )}
        </div>
      </div>
    )

    const aliasId = idPrefix + '-alias'
    const dialogBody = (
      <div>
        {serverError}
        <form className='form-horizontal'>
          {sizeEditor}
          <div className='form-group'>
            <label className='col-sm-3 control-label' htmlFor={aliasId}>{msg.alias()}</label>
            <div className='col-sm-9'>
              <input
                type='text'
                id={aliasId}
                className='form-control'
                onChange={this.onAliasChange}
                value={this.state.alias} />
            </div>
          </div>
          {storageDomainEditor}
        </form>
      </div>
    )

    const progressIndicator = this.props.showProgressIndicator && (
      <div className={`spinner spinner-sm spinner-inline ${style.spinner}`} />
    )

    return (
      <Modal onHide={this.onCancel} show>
        <Modal.Header>
          <button
            className='close'
            onClick={this.onCancel}
          >
            <span className='pficon pficon-close' title={msg.close()} />
          </button>
          <Modal.Title>{msg.createNewDisk()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dialogBody}
        </Modal.Body>
        <Modal.Footer>
          {progressIndicator}
          <button className='btn btn-default' onClick={this.onCancel}>{msg.cancel()}</button>
          <button className='btn btn-primary' onClick={this.onCreate} disabled={!someStorageDomainSuitable}>
            {msg.ok()}
          </button>
        </Modal.Footer>
      </Modal>
    )
  }
}

NewDiskDialog.propTypes = {
  vm: PropTypes.object.isRequired, // plain JS object
  clusters: PropTypes.object.isRequired, // plain JS object
  storageDomains: PropTypes.array.isRequired, // plain JS object
  dataCenters: PropTypes.array.isRequired, // plain JS object
  errorText: PropTypes.string,
  showProgressIndicator: PropTypes.bool.isRequired,
  createDiskFunction: PropTypes.func.isRequired, // ({ sizeB: string, alias: string, storageDomainId: string, vmId: string }) => any
  cleanStoreSubtreeFunction: PropTypes.func.isRequired, // () => any
  onClose: PropTypes.func.isRequired, // () => any
}

const NewDiskDialogConnected = connect(
  (state, { vmId }) => ({
    vm: state.vms.getIn(['vms', vmId]).toJS(),
    clusters: state.clusters.toJS(),
    storageDomains: state.storageDomains.toJS(),
    dataCenters: state.dataCenters.toJS(),
    errorText: state.NewDiskDialog.get('errorText'),
    showProgressIndicator: !!state.NewDiskDialog.get('showProgressIndicator'),
    done: state.NewDiskDialog.get('done'),
  }),
  (dispatch, { vmId }) => ({
    createDiskFunction:
      (sizeB, alias, storageDomainId, iface) => dispatch(createDiskForVm(sizeB, alias, storageDomainId, iface, vmId)),
    cleanStoreSubtreeFunction: () => dispatch(cleanNewDiskDialogSubtree()),
  }),
)(NewDiskDialog)

NewDiskDialogConnected.propTypes = {
  vmId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired, // () => any
}

export default NewDiskDialogConnected

function unknownDataCenterName () {
  return `[${msg.unknownDatacenter()}]`
}
