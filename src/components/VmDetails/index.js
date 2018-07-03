import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import styles from './style.css'

import { Grid, Row, Col } from './GridComponents'
import DetailsCard from './cards/DetailsCard'
import DisksCard from './cards/DisksCard'
import NicsCard from './cards/NicsCard'
import OverviewCard from './cards/OverviewCard'
import SnapshotsCard from './cards/SnapshotsCard'
import UtilizationCard from './cards/UtilizationCard'

/**
 * UX Redesign base component for the VM details card page.
 *
 * NOTE: I'm ignoring Pools and Pool VMs on purpose right now.
 */
const VmDetailsContainer = ({ vm, userMessages }) => {
  return (
    <Grid className={styles['details-container']}>
      <Row>
        <Col cols={4}><OverviewCard vm={vm} /></Col>
        <Col cols={5}><DetailsCard vm={vm} /></Col>
        <Col cols={3}><SnapshotsCard vm={vm} /></Col>
      </Row>
      <Row>
        <Col cols={9}><UtilizationCard vm={vm} /></Col>
        <Col cols={3}>
          <NicsCard vm={vm} />
          <DisksCard vm={vm} />
        </Col>
      </Row>
    </Grid>
  )
}
VmDetailsContainer.propTypes = {
  vm: PropTypes.object,
  userMessages: PropTypes.object.isRequired,
}

const VmDetailsContainerConnected = connect(
  state => ({
    userMessages: state.userMessages,
  })
)(VmDetailsContainer)

export default VmDetailsContainerConnected
