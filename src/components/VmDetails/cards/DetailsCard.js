import React from 'react'
import PropTypes from 'prop-types'

import { ControlLabel, FormControlStatic } from 'patternfly-react'
import { Grid, Row, Col } from '../GridComponents'
import BaseCard from '../BaseCard'
// import style from '../style.css'

const ViewDetailItem = ({ label, value }) => {
  return (
    <Row>
      <Col cols={3}>
        <ControlLabel>{label}</ControlLabel>
      </Col>
      <Col cols={9}>
        <FormControlStatic>{value}</FormControlStatic>
      </Col>
    </Row>
  )
}
ViewDetailItem.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
}

/**
 * Specific information and details of the VM (status, uptime, IP, FQDN
 * host, cluster, data center, template, CD, ??could-init??
 */
const DetailsCard = ({ vm }) => {
  return (
    <BaseCard
      title='Details'
      editTooltip={`Edit details for ${vm.get('id')}`}
      onCancel={() => {}}
      onSave={() => {}}
    >
      {({ isEditing }) => {
        return (
          <Grid>
            <Row>
              <Col>
                <Grid>
                  {/*
                  <ViewDetailItem label='Status' value='Running' />
                  <ViewDetailItem label='Host' value={vm.get('hostId', 'ABC')} />
                  <ViewDetailItem label='IP Address' value={vm.get('fqdn', 'DEF')} />
                  <ViewDetailItem label='FQDN' value={vm.get('fqdn', 'GHI')} />
                  */}
                </Grid>
              </Col>
              <Col>
                <Grid>
                  {/*
                  <ViewDetailItem label='Status' value='Running' />
                  <ViewDetailItem label='Host' value={vm.get('hostId', 'JKL')} />
                  <ViewDetailItem label='IP Address' value={vm.get('fqdn', 'MNO')} />
                  <ViewDetailItem label='FQDN' value={vm.get('fqdn', 'PQR')} />
                  */}
                </Grid>
              </Col>
            </Row>
          </Grid>
        )
      }}
    </BaseCard>
  )
}
DetailsCard.propTypes = {
  vm: PropTypes.object,
}

export default DetailsCard
