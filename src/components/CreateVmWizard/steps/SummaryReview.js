import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Alert, Icon, Spinner, Label } from 'patternfly-react'
import { InfoCircleIcon } from '@patternfly/react-icons'

import { MsgContext, enumMsg } from '_/intl'
import { templateNameRenderer, userFormatOfBytes } from '_/helpers'
import { Grid, Row, Col } from '_/components/Grid'
import { Tooltip } from '_/components/tooltips'
import { sortNicsDisks } from '_/components/utils'

import { BASIC_DATA_SHAPE, NIC_SHAPE, STORAGE_SHAPE } from '../dataPropTypes'
import { optimizedForMap } from './BasicSettings'
import { NicNameWithLabels } from './Networking'
import { DiskNameWithLabels } from './Storage'
import style from './style.css'
import { EMPTY_VNIC_PROFILE_ID } from '_/constants'

const Item = ({ id, label, children }) =>
  <div className={style['review-item']}>
    <div className={style['review-item-label']}>{label}</div>
    <div className={style['review-item-content']}>
      {children}
    </div>
  </div>

Item.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([ PropTypes.node, PropTypes.string ]),
}

const ReviewBasic = ({ id, dataCenters, clusters, isos, templates, operatingSystems, basic }) => {
  const { msg } = useContext(MsgContext)
  const vmOS = operatingSystems.get(basic.operatingSystemId)

  return <React.Fragment>
    <Item id={`${id}-name`} label={msg.name()}>{basic.name}</Item>
    { basic.description && <Item id={`${id}-desc`} label={msg.description()}>{basic.description}</Item> }
    <Item id={`${id}-datacenter`} label={msg.dataCenter()}>{dataCenters.find(dc => dc.id === basic.dataCenterId).name}</Item>
    <Item id={`${id}-cluster`} label={msg.cluster()}>{clusters.get(basic.clusterId).get('name')}</Item>

    { basic.provisionSource === 'iso' &&
      <React.Fragment>
        <Item id={`${id}-provision-source`} label={msg.provisionSource()}>{msg.createVmWizardSourceISO()}</Item>
        <Item id={`${id}-iso`} label={msg.cd()}>{isos[basic.isoImage]}</Item>
      </React.Fragment>
    }
    { basic.provisionSource === 'template' &&
      <React.Fragment>
        <Item id={`${id}-provision-source`} label={msg.provisionSource()}>{msg.createVmWizardSourceTemplate()}</Item>
        <Item id={`${id}-template`} label={msg.template()}>
          { templateNameRenderer(templates.get(basic.templateId)) }
          { basic.templateClone &&
            <Label id={`${id}-template-clone`} bsStyle='info'>clone</Label>
          }
        </Item>
      </React.Fragment>
    }

    <Item id={`${id}-timezone`} label={msg.timezone()}>{basic.timeZone.name}</Item>
    <Item id={`${id}-os`} label={msg.operatingSystem()}>{vmOS.get('description')}</Item>
    <Item id={`${id}-memory`} label={msg.memory()}>{userFormatOfBytes(basic.memory, 'MiB').str}</Item>
    <Item id={`${id}-cpus`} label={msg.cpus()}>
      { basic.cpus }
      <Tooltip
        id={`${id}-summary-vcpus-tooltip`}
        tooltip={
          <div>
            <span>The total virtual CPUs include:</span>
            <ul className={style['cpu-tooltip-list']} >
              <li>{msg.totalSocketsCpuTooltipMessage({ number: basic.topology.sockets })}</li>
              <li>{msg.totalCoresCpuTooltipMessage({ number: basic.topology.cores })}</li>
              <li>{msg.totalThreadsCpuTooltipMessage({ number: basic.topology.threads })}</li>
            </ul>
          </div>
        }
        placement={'top'}
      >
        <InfoCircleIcon className={style['info-circle-icon']} />
      </Tooltip>    </Item>
    <Item id={`${id}-optimizedFor`} label={msg.optimizedFor()}>{optimizedForMap(msg)[basic.optimizedFor].value}</Item>
  </React.Fragment>
}
ReviewBasic.propTypes = {
  id: PropTypes.string,
  dataCenters: PropTypes.object,
  clusters: PropTypes.object,
  isos: PropTypes.object,
  templates: PropTypes.object,
  operatingSystems: PropTypes.object,
  basic: PropTypes.shape(BASIC_DATA_SHAPE).isRequired,
}

const ReviewNetworking = ({ id, vnicProfiles, network }) => {
  const { msg } = useContext(MsgContext)
  const vnicNames = vnicProfiles.reduce((map, vnic) => {
    map[vnic.get('id')] = `${vnic.getIn(['network', 'name'])}/${vnic.get('name')}`
    return map
  }, {
    [EMPTY_VNIC_PROFILE_ID]: msg.nicNoVnicAssigned(),
  })

  return <Item id={`${id}-networking`} label={msg.createVmWizardStepTitleNetwork()}>
    { network.length === 0 && <div>{msg.createVmNetEmptyInfo()}</div> }

    { network.length > 0 &&
      <React.Fragment>
        { network.map(nic =>
          <div key={nic.id}>
            <div className={style['review-entity-info']}>
              <NicNameWithLabels id={id} nic={nic} />
            </div>
            <div className={style['review-entity-info']}>
              { vnicNames[nic.vnicProfileId] ? vnicNames[nic.vnicProfileId] : msg.createVmNetUnknownVnicProfile() }
            </div>
            <div className={style['review-entity-info']}>
              { enumMsg('NicInterface', nic.deviceType, msg) }
            </div>
          </div>
        )}
      </React.Fragment>
    }
  </Item>
}
ReviewNetworking.propTypes = {
  id: PropTypes.string,
  vnicProfiles: PropTypes.object,
  network: PropTypes.arrayOf(PropTypes.shape(NIC_SHAPE)).isRequired,
}

const ReviewStorage = ({ id, storageDomains, storage }) => {
  const { msg } = useContext(MsgContext)
  return <Item id={`${id}-storage`} label={msg.createVmWizardStepTitleStorage()}>
    { storage.length === 0 && <div>{msg.createVmStorageEmptyInfo()}</div> }

    { storage.length > 0 &&
      storage.map(disk =>
        <div key={disk.id}>
          <div className={style['review-entity-info']}>
            <DiskNameWithLabels id={id} disk={disk} />
          </div>
          <div className={style['review-entity-info']}>
            { userFormatOfBytes(disk.size, 'B').str }
          </div>
          <div className={style['review-entity-info']}>
            { storageDomains.getIn([ disk.storageDomainId, 'name' ], msg.createVmStorageUnknownStorageDomain()) }
          </div>
          <div className={style['review-entity-info']}>
            {
              disk.diskType === 'thin' ? msg.diskEditorDiskTypeOptionThin()
                : disk.diskType === 'pre' ? msg.diskEditorDiskTypeOptionPre()
                  : disk.diskType
            }
          </div>
          {/* TODO: Include disk interface? */}
        </div>
      )
    }
  </Item>
}
ReviewStorage.propTypes = {
  id: PropTypes.string,
  storageDomains: PropTypes.object,
  storage: PropTypes.arrayOf(PropTypes.shape(STORAGE_SHAPE)).isRequired,
}

const ReviewAdvanced = ({ id, operatingSystems, basic }) => {
  const { msg } = useContext(MsgContext)
  const hasAdvanced = basic.startOnCreation || basic.cloudInitEnabled
  const vmOS = operatingSystems.get(basic.operatingSystemId)

  if (!hasAdvanced) {
    return null
  }

  return <Item id={`${id}-advanced-options`} label={'Advanced'}>
    { basic.startOnCreation && <div id={`${id}-startOnCreation`}>{msg.startVmOnCreation()}</div> }
    { basic.cloudInitEnabled && !vmOS.get('isWindows') &&
      <React.Fragment>
        <div>{msg.createVmWizardReviewAdvancedCloudInit()}</div>
        <div className={style['review-subsection']}>
          { basic.initHostname &&
            <Item id={`${id}-cloud-init-hostname`} label={msg.hostName()}>{ basic.initHostname }</Item>
          }
          { basic.initSshKeys &&
            <Item id={`${id}-cloud-init-sshkey`} label={msg.sshAuthorizedKeys()}>{ basic.initSshKeys }</Item>
          }
        </div>
      </React.Fragment>
    }
    { basic.cloudInitEnabled && vmOS.get('isWindows') &&
      <React.Fragment>
        <div>{msg.createVmWizardReviewAdvancedSysprep()}</div>
        <div className={style['review-subsection']}>
          { basic.initHostname &&
            <Item id={`${id}-sysprep-hostname`} label={msg.hostName()}>{ basic.initHostname }</Item>
          }
          { basic.initTimezone &&
            <Item id={`${id}-sysprep-tz`} label={msg.sysPrepTimezone()}>{ basic.initTimezone }</Item>
          }
          { basic.initAdminPassword &&
            <Item id={`${id}-sysprep-admin-pwd`} label={msg.sysPrepAdministratorPassword()}>
              ******
            </Item>
          }
          { basic.initCustomScript &&
            <Item id={`${id}-sysprep-custom-script`} label={msg.sysPrepCustomScript()}>
              { basic.initCustomScript }
            </Item>
          }
        </div>
      </React.Fragment>
    }
  </Item>
}
ReviewAdvanced.propTypes = {
  id: PropTypes.string,
  operatingSystems: PropTypes.object,
  basic: PropTypes.shape(BASIC_DATA_SHAPE).isRequired,
}

/**
 * Purely controlled component to show a review of the new VM and to visualize
 * the creation progress.
 */
const SummaryReview = ({
  id: propsId,
  network,
  storage,
  progress = { inProgress: false },
  dataCenters,
  clusters,
  templates,
  operatingSystems,
  isoFiles,
  basic,
  vnicProfiles,
  storageDomains,
}) => {
  const { msg, locale } = useContext(MsgContext)
  const id = propsId ? `${propsId}-review` : 'create-vm-wizard-review'

  const disksList = sortNicsDisks([...storage], locale) // Sort the template based ones first, then by name
  const nicsList = sortNicsDisks([...network], locale)

  return (<div className={style['review-content']}>
    { (!progress.inProgress && !progress.result) &&
    <div id={`${id}-progress-review-and-confirm`} className={style['review-progress']}>
      <div className={style['review-icon-container']}>
        <Icon className={style['review-icon']} type='pf' name='virtual-machine' />
      </div>
      <div className={style['review-text']}>
        {msg.createVmWizardReviewConfirm()}
      </div>
    </div>
    }
    { progress.inProgress &&
    <div id={`${id}-progress-in-progress`} className={style['review-progress']}>
      <div className={style['review-icon-container']}>
        <Spinner className={style['review-spinner']} loading size='lg' />
      </div>
      <div className={style['review-text']}>
        {msg.createVmWizardReviewInProgress()}
      </div>
    </div>
    }
    { progress.result === 'success' &&
    <div id={`${id}-progress-success`} className={style['review-progress']}>
      <div className={style['review-icon-container']}>
        <Icon className={style['review-icon']} type='pf' name='ok' />
      </div>
      <div className={style['review-text']}>
        {msg.createVmWizardReviewSuccess()}
      </div>
      { progress.messages && progress.messages.length > 0 &&
      <Alert type='success' >
        {progress.messages.map((message, index) =>
          <div key={`message-${index}`}>
            { message }
          </div>
        )}
      </Alert>
      }
    </div>
    }
    { progress.result === 'error' &&
    <div id={`${id}-progress-error`} className={style['review-progress']}>
      <div className={style['review-icon-container']}>
        <Icon className={style['review-icon']} type='pf' name='error-circle-o' />
      </div>
      <div className={style['review-text']}>
        {msg.createVmWizardReviewError()}
      </div>
      { progress.messages && progress.messages.length > 0 &&
      <Alert type='error' >
        {progress.messages.map((message, index) =>
          <div key={`message-${index}`}>
            { message }
          </div>
        )}
      </Alert>
      }
    </div>
    }

    <Grid>
      <Row>
        <Col>
          <ReviewBasic
            id={`${id}-basic`}
            dataCenters={dataCenters}
            clusters={clusters}
            templates={templates}
            operatingSystems={operatingSystems}
            isos={isoFiles}
            basic={basic}
          />
          <ReviewNetworking
            id={`${id}-network`}
            vnicProfiles={vnicProfiles}
            network={nicsList}
          />
          <ReviewStorage
            id={`${id}-storage`}
            storageDomains={storageDomains}
            storage={disksList}
          />
          <ReviewAdvanced
            id={`${id}-advanced`}
            operatingSystems={operatingSystems}
            basic={basic}
          />
        </Col>
      </Row>
    </Grid>

  </div>)
}

SummaryReview.propTypes = {
  id: PropTypes.string,

  basic: PropTypes.shape(BASIC_DATA_SHAPE).isRequired,
  network: PropTypes.arrayOf(PropTypes.shape(NIC_SHAPE)).isRequired,
  storage: PropTypes.arrayOf(PropTypes.shape(STORAGE_SHAPE)).isRequired,

  progress: PropTypes.shape({
    inProgress: PropTypes.bool.isRequired,
    result: PropTypes.oneOf([ 'success', 'error' ]),
    messages: PropTypes.arrayOf(PropTypes.string),
  }),

  clusters: PropTypes.object,
  dataCenters: PropTypes.object,
  isoFiles: PropTypes.object,
  operatingSystems: PropTypes.object,
  storageDomains: PropTypes.object,
  templates: PropTypes.object,
  vnicProfiles: PropTypes.object,
}

export default connect(
  (state, props) => ({
    clusters: state.clusters,
    dataCenters: state.dataCenters,
    isoFiles:
      state.storageDomains.filter(sd => sd.has('files')).reduce(
        (isoFiles, sd) => {
          sd.get('files').forEach(file => { isoFiles[file.id] = file.name })
          return isoFiles
        },
        {}
      ),
    operatingSystems: state.operatingSystems,
    storageDomains: state.storageDomains,
    templates: state.templates,
    vnicProfiles: state.vnicProfiles,
  })
)(SummaryReview)
