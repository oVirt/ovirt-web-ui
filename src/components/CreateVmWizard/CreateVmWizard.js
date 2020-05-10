import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Wizard, Button, Icon } from 'patternfly-react'
import merge from 'lodash/merge'
import { List } from 'immutable'

import * as Actions from '_/actions'
import { generateUnique } from '_/helpers'
import { msg } from '_/intl'
import { createTemplateList } from '_/components/utils'

import BasicSettings from './steps/BasicSettings'
import Networking from './steps/Networking'
import Storage from './steps/Storage'
import SummaryReview from './steps/SummaryReview'

const DEFAULT_STATE = {
  activeStepIndex: 0,
  steps: {
    basic: {
      operatingSystemId: '0', // "Other OS"
      memory: 1024, // MiB
      cpus: 1,
      startOnCreation: false,
      initEnabled: false,
      optimizedFor: 'desktop',
    },
    network: {
      nics: [],
      updated: 0,
    },
    storage: {
      disks: [],
      updated: 0,
    },
  },

  // Creation status tracking to drive how the Review screen looks
  correlationId: null,
}

/**
 * Given the set of clusters and VM templates available to the user, build the initial
 * new VM state for the create wizard.
 */
function getInitialState (clusters, templates, blankTemplateId) {
  // 1 cluster available? select it by default
  let clusterId
  if (clusters.size === 1) {
    clusterId = clusters.first().get('id')
  }

  // 1 template available (Blank only) on the default cluster? set the source to 'iso'
  let provisionSource = 'template'
  let templateId
  if (clusterId) {
    const templateList = createTemplateList(templates, clusterId)
    if (templateList.length === 1 && templateList[0].id === blankTemplateId) {
      provisionSource = 'iso'
    } else {
      templateId = blankTemplateId
    }
  }

  const state = merge(
    {},
    DEFAULT_STATE,
    {
      steps: {
        basic: {
          clusterId,
          provisionSource,
          templateId,
        },
      },
    })
  return state
}

/**
 * Wizard to create a new VM.  Each step in the wizard is a controlled component.  All
 * of the new VM data is held in this component's state until the creation is submitted
 * or the wizard is canceled or closed.
 *
 * Create a new VM from the following sources:
 *   1. ISO (from "scratch")
 *     - Blank Template
 *     - Pick an ISO from the selected Data Center and load as the VM's CD
 *     - Initial boot from CD
 *     - Need to create a disk (unless it is a live CD?, maybe warn on review)
 *     - NIC isn't strictly needed
 *
 *   2. Template
 *     - Pick a template available from the selected Data Center
 *     - Default to __thin__/dependent template use, use __clone__/independent based on
 *       the computer type (desktop == thin, server == clone)
 *         Note: on webadmin, the option is on 'Resource Allocation' advanced options tab
 *         See: https://github.com/oVirt/ovirt-web-ui/issues/882
 *     - Clone permissions? (true if clone is true)
 *     - Boot based on template settings
 *     - Use thin or cloned disks from template (allow adding more and change storage domains)
 *     - NICs default to those from the template (allow adding more)
 */
class CreateVmWizard extends React.Component {
  constructor (props) {
    super(props)

    this.state = getInitialState(props.clusters, props.templates, props.blankTemplateId)
    this.hideAndResetState = this.hideAndResetState.bind(this)
    this.hideAndNavigate = this.hideAndNavigate.bind(this)
    this.handleBasicOnUpdate = this.handleBasicOnUpdate.bind(this)
    this.handleBasicOnExit = this.handleBasicOnExit.bind(this)
    this.handleListOnUpdate = this.handleListOnUpdate.bind(this)
    this.handleCreateVm = this.handleCreateVm.bind(this)
    this.wizardGoToStep = this.wizardGoToStep.bind(this)
    this.wizardClickBack = this.wizardClickBack.bind(this)
    this.wizardClickNext = this.wizardClickNext.bind(this)

    this.wizardStepsMap = {
      basic: {
        title: msg.createVmWizardStepTitleBasic(),
        preventEnter: false,
        preventExit: true,

        render: () => (
          <BasicSettings
            id='create-vm-wizard-basic'
            data={this.state.steps.basic}
            defaultValues={DEFAULT_STATE.steps.basic}

            onUpdate={({ valid = false, partialUpdate = {} }) => {
              this.handleBasicOnUpdate(partialUpdate)
              this.wizardStepsMap.basic.preventExit = !valid
            }}
          />
        ),
        onExit: this.handleBasicOnExit,
      },

      network: {
        title: msg.createVmWizardStepTitleNetwork(),
        preventEnter: false,
        preventExit: false,

        render: () => (
          <Networking
            id='create-vm-wizards-net'
            dataCenterId={this.state.steps.basic.dataCenterId}
            clusterId={this.state.steps.basic.clusterId}
            nics={this.state.steps.network.nics}

            onUpdate={({ valid = true, ...updatePayload }) => {
              this.handleListOnUpdate('network', 'nics', updatePayload)
              this.wizardStepsMap.network.preventExit = !valid
            }}
          />
        ),
      },

      storage: {
        title: msg.createVmWizardStepTitleStorage(),
        preventEnter: false,
        preventExit: false,

        render: () => (
          <Storage
            id='create-vm-wizards-storage'
            vmName={this.state.steps.basic.name}
            clusterId={this.state.steps.basic.clusterId}
            dataCenterId={this.state.steps.basic.dataCenterId}
            optimizedFor={this.state.steps.basic.optimizedFor}
            disks={this.state.steps.storage.disks}

            onUpdate={({ valid = true, ...updatePayload }) => {
              this.handleListOnUpdate('storage', 'disks', updatePayload)
              this.wizardStepsMap.storage.preventExit = !valid
            }}
          />
        ),
      },

      review: {
        title: msg.createVmWizardStepTitleReview(),
        preventEnter: false,
        preventExit: false,

        render: () => {
          const { correlationId } = this.state
          const inProgress = correlationId !== null && !this.props.actionResults.has(correlationId)

          const correlatedResult = correlationId === null || inProgress
            ? undefined
            : this.props.actionResults.get(correlationId) ? 'success' : 'error'

          // Look for any `userMessages` that correlate to the last create action executed
          const correlatedMessages = correlationId === null
            ? null
            : this.props.userMessages
              .get('records')
              .filter(
                record => record.getIn([ 'failedAction', 'meta', 'correlationId' ]) === correlationId
              )
              .map(record => record.get('message'))
              .toJS()

          return <SummaryReview
            id='create-vm-wizard-review'
            basic={this.state.steps.basic}
            network={this.state.steps.network.nics}
            storage={this.state.steps.storage.disks}
            progress={{
              inProgress,
              result: correlatedResult, // undefined (no result yet) | 'success' | 'error'
              messages: correlatedMessages,
            }}
          />
        },
        onExit: () => {
          this.setState({ correlationId: null })
        },
      },
    }
    this.wizardSteps = [
      this.wizardStepsMap.basic,
      this.wizardStepsMap.network,
      this.wizardStepsMap.storage,
      this.wizardStepsMap.review,
    ]
  }

  hideAndResetState () {
    const { onHide, clusters, templates, blankTemplateId } = this.props

    this.setState(getInitialState(clusters, templates, blankTemplateId))
    merge(this.wizardStepsMap, {
      basic: {
        preventEnter: false,
        preventExit: true,
      },
      network: {
        preventEnter: false,
        preventExit: false,
      },
      storage: {
        preventEnter: false,
        preventExit: false,
      },
      review: {
        preventEnter: false,
        preventExit: false,
      },
    })

    onHide()
  }

  hideAndNavigate () {
    const vmId = this.props.actionResults.get(this.state.correlationId)
    this.hideAndResetState()
    this.props.navigateToVm(vmId)
  }

  handleBasicOnUpdate (partialUpdate) {
    const { provisionSource, templateId } = this.state.steps.basic
    const { provisionSource_, templateId_ } = partialUpdate

    this.setState(state => {
      const extraUpdates = {}
      if (provisionSource !== provisionSource_ || templateId !== templateId_) {
        // reset network and storage updates if the provision source or selected template changes
        extraUpdates.network = merge({}, state.steps.network, { updated: 0 })
        extraUpdates.storage = merge({}, state.steps.storage, { updated: 0 })
      }

      return {
        steps: {
          ...state.steps,
          basic: {
            ...state.steps.basic,
            ...partialUpdate,
          },
          ...extraUpdates,
        },
      }
    })
  }

  /**
   * Before transitioning off the Basic page, setup the NICs and Disks as appropriate
   * based on what has been selected/changed.
   */
  handleBasicOnExit () {
    const resetNics = this.state.steps.network.updated === 0
    const resetDisks = this.state.steps.storage.updated === 0

    if (resetNics || resetDisks) {
      this.setState(state => {
        const template = this.props.templates.get(this.state.steps.basic.templateId)
        const update = { steps: { ...state.steps } }

        if (resetNics) {
          update.steps.network = {
            updated: (state.steps.network.updated + 1),
            nics: !template
              ? []
              : template.get('nics', List())
                .map(nic => ({
                  id: nic.get('id'),
                  name: nic.get('name'),
                  vnicProfileId: nic.getIn(['vnicProfile', 'id']),
                  deviceType: nic.get('interface'),
                  isFromTemplate: true,
                }))
                .toJS(),
          }
        }

        if (resetDisks) {
          update.steps.storage = {
            updated: (state.steps.storage.updated + 1),
            disks: !template
              ? []
              : template.get('disks', List())
                .map(disk => ({
                  id: disk.get('attachmentId'),
                  name: disk.get('name'),

                  diskId: disk.get('id'),
                  storageDomainId: disk.get('storageDomainId'),

                  bootable: disk.get('bootable'),
                  iface: disk.get('iface'),
                  type: disk.get('type'), // [ image | lun | cinder ]
                  format: disk.get('format'), // [ cow | raw ]
                  size: disk.get('provisionedSize'), // bytes
                  isFromTemplate: true,
                }))
                .toJS(),
          }
        }

        return update
      })
    }
  }

  handleListOnUpdate (stepName, listName, { remove, update, create }, setStateCallback) {
    this.setState(state => {
      let list = this.state.steps[stepName][listName].slice(0)

      if (remove) {
        list = list.filter(item => item.id !== remove)
      }

      if (update) {
        const toUpdate = list.findIndex(item => item.id === update.id)
        if (toUpdate >= 0) {
          list[toUpdate] = { ...list[toUpdate], ...update }
        }
      }

      if (create) {
        list.push(create)
      }

      const newState = {
        steps: {
          ...state.steps,
          [stepName]: {
            ...state.steps[stepName],
            [listName]: list,
            updated: (state.steps[stepName].updated + 1),
          },
        },
      }
      return newState
    },
    setStateCallback)
  }

  handleCreateVm () {
    const correlationId = generateUnique('CreateVmWizard_')
    const { basic, network: { nics }, storage: { disks } } = this.state.steps

    this.setState({ correlationId })
    this.props.onCreate(basic, nics, disks, correlationId)
  }

  wizardGoToStep (newStepIndex) {
    const { activeStepIndex } = this.state
    const activeStep = this.wizardSteps[activeStepIndex]
    const newStep = this.wizardSteps[newStepIndex]

    // make sure we can leave the current step and enter the new step
    if (activeStep.preventExit || newStep.preventEnter) return

    // run and the current step's `onExit()`
    if (activeStep.onExit) {
      activeStep.onExit()
    }

    this.setState({ activeStepIndex: newStepIndex })
  }

  wizardClickBack () {
    this.wizardGoToStep(Math.max(this.state.activeStepIndex - 1, 0))
  }

  wizardClickNext () {
    this.wizardGoToStep(Math.min(this.state.activeStepIndex + 1, this.wizardSteps.length - 1))
  }

  render () {
    const { activeStepIndex, correlationId } = this.state
    const activeStep = this.wizardSteps[activeStepIndex]
    const vmCreateWorking = correlationId !== null && !this.props.actionResults.has(correlationId)
    const vmCreateStarted = correlationId !== null && !!this.props.actionResults.get(correlationId)

    const isReviewStep = this.wizardSteps[activeStepIndex] === this.wizardStepsMap.review
    const isPrimaryNext = !isReviewStep
    const isPrimaryCreate = isReviewStep && !vmCreateStarted
    const isPrimaryClose = isReviewStep && vmCreateStarted

    return <Wizard
      dialogClassName='modal-lg wizard-pf'
      show={this.props.show}
      onHide={this.hideAndResetState}
    >
      <Wizard.Header onClose={this.hideAndResetState} title={msg.addNewVm()} />
      <Wizard.Body>
        <Wizard.Pattern.Body
          steps={this.wizardSteps}
          activeStepIndex={activeStepIndex}
          activeStepStr={(activeStepIndex + 1).toString()}
          goToStep={this.wizardGoToStep}
        />
      </Wizard.Body>
      <Wizard.Footer>
        <Button bsStyle='default' onClick={this.hideAndResetState}>
          { msg.createVmWizardButtonCancel() }
        </Button>
        <Button bsStyle='default' onClick={this.wizardClickBack} disabled={activeStepIndex === 0 || isPrimaryClose}>
          <Icon type='fa' name='angle-left' />
          { msg.createVmWizardButtonBack() }
        </Button>

        { isPrimaryClose &&
          <Button onClick={this.hideAndResetState}>
            { msg.createVmWizardButtonClose() }
          </Button>
        }
        <Button
          bsStyle='primary'
          onClick={
            isPrimaryNext ? this.wizardClickNext
              : isPrimaryCreate ? this.handleCreateVm
                : this.hideAndNavigate
          }
          disabled={activeStep.preventExit || vmCreateWorking}
        >
          { isPrimaryNext && msg.createVmWizardButtonNext() }
          { isPrimaryCreate && msg.createVmWizardButtonCreate() }
          { isPrimaryClose && msg.createVmWizardButtonCloseAndNavigate() }
          <Icon type='fa' name='angle-right' />
        </Button>
      </Wizard.Footer>
    </Wizard>
  }
}
CreateVmWizard.propTypes = {
  show: PropTypes.bool,
  onHide: PropTypes.func,

  clusters: PropTypes.object.isRequired,
  templates: PropTypes.object.isRequired,
  blankTemplateId: PropTypes.string.isRequired,
  userMessages: PropTypes.object.isRequired,
  actionResults: PropTypes.object.isRequired,

  onCreate: PropTypes.func,
  navigateToVm: PropTypes.func,
}

export default connect(
  (state) => ({
    clusters: state.clusters,
    templates: state.templates,
    blankTemplateId: state.config.get('blankTemplateId'),
    userMessages: state.userMessages,
    actionResults: state.vms.get('correlationResult'),
  }),
  (dispatch) => ({
    onCreate: (basic, nics, disks, correlationId) => dispatch(
      Actions.composeAndCreateVm({ basic, nics, disks }, { correlationId })
    ),
    navigateToVm: (vmId) => dispatch(Actions.navigateToVmDetails(vmId)),
  })
)(CreateVmWizard)
