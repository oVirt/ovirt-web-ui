import React from 'react'
import PropTypes from 'prop-types'
import { Alert, Card, CardBody } from 'patternfly-react'
import { withMsg } from '_/intl'

import styles from './style.css'

import NavigationPrompt from 'react-router-navigation-prompt'
import NavigationConfirmationModal from '../NavigationConfirmationModal'

import { Grid, Row, Col } from '_/components/Grid'
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
class VmDetailsContainer extends React.Component {
  constructor (props) {
    super(props)
    this.trackEdits = { // changes to a card's edit state don't require a re-render here
      edit: {},
    }
    this.state = {
      anyDirtyEdit: false,
    }
  }

  handleEditChange (card, isEdit, isDirty = false) {
    const cardEdit = this.trackEdits.edit[card] || {}
    cardEdit.edit = isEdit
    cardEdit.dirty = isDirty

    const edit = { ...this.trackEdits.edit, [card]: cardEdit }
    const anyDirtyEdit = Object.entries(edit).reduce((acc, [card, value]) => acc || !!value.dirty, false)

    console.debug(`card "${card}" \u2192 isEdit? ${isEdit}, isDirty? ${isDirty} ∴ edit`, edit, 'anyDirtyEdit?', anyDirtyEdit)
    this.trackEdits = { edit, anyDirtyEdit }
    if (!anyDirtyEdit !== !this.state.anyDirtyEdit) {
      this.setState({ anyDirtyEdit })
    }
  }

  render () {
    const { vm, msg } = this.props

    return (
      <Grid className={styles['details-container']}>
        <NavigationPrompt when={this.state.anyDirtyEdit}>
          {({ isActive, onConfirm, onCancel }) => (
            <NavigationConfirmationModal show={isActive} onYes={onConfirm} onNo={onCancel} />
          )}
        </NavigationPrompt>

        {vm.get('nextRunExists') &&
          <Row>
            <Col>
              <Card>
                <CardBody>
                  <Alert type='info' style={{ margin: '0' }}>{msg.vmHasPendingConfigurationChanges()}</Alert>
                </CardBody>
              </Card>
            </Col>
          </Row>
        }

        <Row>
          <Col cols={4} className={styles['col-overview']}><OverviewCard vm={vm} onEditChange={(isEdit, isDirty) => this.handleEditChange('over', isEdit, isDirty)} /></Col>
          <Col cols={5} className={styles['col-details']}><DetailsCard vm={vm} onEditChange={(isEdit, isDirty) => this.handleEditChange('detail', isEdit, isDirty)} /></Col>
          <Col cols={3} className={styles['col-snapshots']}><SnapshotsCard vm={vm} onEditChange={(isEdit, isDirty) => this.handleEditChange('snap', isEdit, isDirty)} /></Col>
        </Row>
        <Row>
          <Col cols={9} className={styles['col-utilization']}><UtilizationCard vm={vm} /></Col>
          <Col cols={3} className={styles['col-nics-disks']}>
            <NicsCard vm={vm} onEditChange={(isEdit, isDirty) => this.handleEditChange('nic', isEdit, isDirty)} />
            <DisksCard vm={vm} onEditChange={(isEdit, isDirty) => this.handleEditChange('disk', isEdit, isDirty)} />
          </Col>
        </Row>
      </Grid>
    )
  }
}

VmDetailsContainer.propTypes = {
  vm: PropTypes.object,
  msg: PropTypes.object.isRequired,
}

export default withMsg(VmDetailsContainer)
