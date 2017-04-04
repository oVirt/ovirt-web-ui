import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'

import LabeledSelect from './LabeledSelect'
import LabeledTextField from './LabeledTextField'
import DetailContainer from './components/DetailContainer'
import ErrorAlert from './ErrorAlert'
import Selectors from './selectors'
import {
  addNewVm,
  editVm,
  changeCluster,
  changeTemplate,
  updateOperatingSystem,
  closeDetail,
  updateVmName,
  updateVmMemory,
  updateVmCpu,
  updateVmDialogErrorMessage,
} from './actions'

class vmDialog extends React.Component {
  constructor (props) {
    super(props)
    this.createNewVm = this.createNewVm.bind(this)
    this.changeCluster = this.changeCluster.bind(this)
    this.changeTemplate = this.changeTemplate.bind(this)
    this.changeOperatingSystem = this.changeOperatingSystem.bind(this)
    this.closeDialog = this.closeDialog.bind(this)
    this.changeVmName = this.changeVmName.bind(this)
    this.changeVmMemory = this.changeVmMemory.bind(this)
    this.changeVmCpu = this.changeVmCpu.bind(this)
    this.submitHandler = this.submitHandler.bind(this)
    this.getMemory = this.getMemory.bind(this)
    this.clearErrorMessage = this.clearErrorMessage.bind(this)
  }

  componentDidUpdate () {
    // without this template combobox its not rerendering
    $(this.cluster).combobox('refresh')
    $(this.template).combobox('refresh')
    $(this.os).combobox('refresh')
  }

  componentDidMount () {
    $(this.cluster).combobox()
    $("input[type='text'].combobox").on('change', () => $(this.changeCluster))
    $(this.template).combobox()
    $("input[type='text'].combobox").on('change', () => $(this.changeTemplate))
    $(this.os).combobox()
    $("input[type='text'].combobox").on('change', () => $(this.changeOperatingSystem))
  }

  submitHandler (e) {
    e.preventDefault()
    this.props.type === 'edit' ? this.editVm() : this.createNewVm()
  }

  getMemory () {
    return parseInt(this.memory.value) * 1048576
  }

  editVm () {
    const vm = {
      'name': this.name.value,
      'template': { 'name': this.template.value },
      'cluster': { 'name': this.cluster.value },
      'memory': this.getMemory(),
      'os': {
        'type': this.os.value,
      },
      'cpu': {
        'topology': {
          'cores': '1',
          'sockets': this.cpus.value,
          'threads': '1',
        },
      },
    }
    this.props.edit(vm, this.props.vmId)
  }

  createNewVm () {
    const vm = {
      'vm': {
        'name': this.name.value,
        'template': { 'name': this.template.value },
        'cluster': { 'name': this.cluster.value },
        'memory': this.getMemory(),
        'os': { 'type': this.os.value },
        'cpu': {
          'topology': {
            'cores': '1',
            'sockets': this.cpus.value,
            'threads': '1',
          },
        },
      },
    }
    this.props.addVm(vm)
  }

  closeDialog (e) {
    e.preventDefault()
    this.props.closeDialog()
  }

  changeCluster () {
    if (!Selectors.getClusterByName(this.cluster.value)) {
      this.props.setErrorMessage('Invalid Cluster selected')
    } else if (this.props.cluster.get('name') === this.cluster.value) {
      this.clearErrorMessage('Cluster')
    } else {
      this.props.changeCluster(Selectors.getClusterByName(this.cluster.value))
      this.clearErrorMessage('Cluster')
    }
  }

  changeTemplate () {
    if (!Selectors.getTemplateByName(this.template.value)) {
      this.props.setErrorMessage('Invalid Template selected')
    } else if (this.props.template.get('name') === this.template.value) {
      this.clearErrorMessage('Template')
    } else {
      this.props.changeTemplate(Selectors.getTemplateByName(this.template.value))
      this.clearErrorMessage('Template')
    }
  }

  changeOperatingSystem () {
    if (!Selectors.getOperatingSystemByName(this.os.value)) {
      this.props.setErrorMessage('Invalid Operating System selected')
    } else if (this.props.os.get('name') === this.os.value) {
      this.clearErrorMessage('Operating System')
    } else {
      this.props.changeOperatingSystem(Selectors.getOperatingSystemByName(this.os.value))
      this.clearErrorMessage('Operating System')
    }
  }

  changeVmName () {
    this.props.changeVmName(this.name.value)
  }

  changeVmMemory () {
    this.props.changeVmMemory(this.memory.value)
  }

  changeVmCpu () {
    this.props.changeVmCpu(this.cpus.value)
  }

  clearErrorMessage (entity) {
    if (this.props.errorMessage.includes(entity)) {
      this.props.setErrorMessage('')
    }
  }

  render () {
    return (
      <DetailContainer>
        <h1>{this.props.type === 'edit' ? 'Edit Virtual Machine' : 'Create A New Virtual Machine'}</h1>
        <hr />
        <ErrorAlert message={this.props.errorMessage} />
        <form className='form-horizontal'>
          <LabeledSelect
            id='clusterSelect'
            label='Cluster'
            selectClass='combobox form-control'
            getValue={(input) => { this.cluster = input }}
            onChange={this.changeCluster}
            value={this.props.cluster.get('name')}
            data={this.props.clusters.get('clusters').sort((a, b) =>
              a.get('name').localeCompare(b.get('name'))
            )} />

          <LabeledSelect
            id='templateSelect'
            label='Template'
            selectClass='combobox form-control'
            getValue={(input) => { this.template = input }}
            onChange={this.changeTemplate}
            value={this.props.template.get('name')}
            data={this.props.templates.get('templates').toList().filter(template => (
                template.get('cluster') === this.props.cluster.get('id') || template.get('cluster') === '0')
              ).sort((a, b) => a.get('name').localeCompare(b.get('name')))} />

          <LabeledSelect
            id='operatingSystemSelect'
            label='Operating System'
            selectClass='combobox form-control'
            getValue={(input) => { this.os = input }}
            onChange={this.changeOperatingSystem}
            value={this.props.os.get('name')}
            data={this.props.operatingSystems.get('operatingSystems').toList().sort((a, b) =>
              a.get('name').localeCompare(b.get('name'))
            )}
            renderer={(item) => item.get('description')} />

          <LabeledTextField
            selectClass='combobox form-control'
            getValue={(input) => { this.name = input }}
            id='vmName'
            label='Name'
            placeholder='VM Name'
            value={this.props.vmName}
            setValue={this.changeVmName} />

          <LabeledTextField
            getValue={(input) => { this.memory = input }}
            type='number'
            id='vmMemory'
            label='Memory (MB)'
            placeholder='VM Memory'
            value={this.props.memory}
            setValue={this.changeVmMemory}
            step={256} />

          <LabeledTextField
            getValue={(input) => { this.cpus = input }}
            type='number'
            id='vmCpu'
            label='CPU'
            placeholder='CPUs'
            value={this.props.cpu}
            setValue={this.changeVmCpu} />

          <div className='form-group'>
            <div className='col-sm-offset-2 col-sm-10'>
              <button className='btn btn-default' type='submit' onClick={this.closeDialog}>Close</button>
              <button className='btn btn-primary' type='submit' onClick={this.submitHandler}>Submit</button>
            </div>
          </div>
        </form>
      </DetailContainer>
    )
  }
}

vmDialog.propTypes = {
  type: PropTypes.string,
  clusters: PropTypes.object.isRequired,
  cluster: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,
  template: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired,
  os: PropTypes.object.isRequired,
  cpu: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  memory: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  vmName: PropTypes.string.isRequired,
  vmId: PropTypes.string.isRequired,
  changeCluster: PropTypes.func.isRequired,
  changeTemplate: PropTypes.func.isRequired,
  changeOperatingSystem: PropTypes.func.isRequired,
  changeVmName: PropTypes.func.isRequired,
  changeVmMemory: PropTypes.func.isRequired,
  changeVmCpu: PropTypes.func.isRequired,
  closeDialog: PropTypes.func.isRequired,
  setErrorMessage: PropTypes.func.isRequired,
  addVm: PropTypes.func.isRequired,
  edit: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
}

export default connect(
  (state) => ({
    clusters: state.clusters,
    templates: state.templates,
    operatingSystems: state.operatingSystems,
    type: state.vmDialog.get('type'),
    cluster: state.vmDialog.get('cluster'),
    template: state.vmDialog.get('template'),
    os: state.vmDialog.get('os'),
    memory: state.vmDialog.get('memory'),
    cpu: state.vmDialog.get('cpu'),
    heading: state.vmDialog.get('dialogName'),
    vmName: state.vmDialog.get('name'),
    vmId: state.vmDialog.get('vmId'),
    errorMessage: state.vmDialog.get('errorMessage'),
  }),
  (dispatch) => ({
    addVm: (vm) =>
      dispatch(addNewVm(vm)),
    edit: (vm, vmId) =>
      dispatch(editVm(vm, vmId)),
    changeCluster: (cluster) =>
      dispatch(changeCluster(cluster)),
    changeOperatingSystem: (os) =>
      dispatch(updateOperatingSystem(os)),
    changeTemplate: (template) =>
      dispatch(changeTemplate(template)),
    changeVmName: (name) =>
      dispatch(updateVmName(name)),
    changeVmMemory: (memory) =>
      dispatch(updateVmMemory(memory)),
    changeVmCpu: (cpu) =>
      dispatch(updateVmCpu(cpu)),
    closeDialog: () =>
      dispatch(closeDetail()),
    setErrorMessage: (message) =>
      dispatch(updateVmDialogErrorMessage(message)),
  })
)(vmDialog)
