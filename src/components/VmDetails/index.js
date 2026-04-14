import React, { useRef, useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useBlocker } from 'react-router-dom'
import { Hint, HintBody, Card, CardBody } from '@patternfly/react-core'
import { withMsg } from '_/intl'

import styles from './style.css'

import NavigationConfirmationModal from '../NavigationConfirmationModal'

import { Grid, Row, Col } from '_/components/Grid'
import DetailsCard from './cards/DetailsCard'
import DisksCard from './cards/DisksCard'
import NicsCard from './cards/NicsCard'
import OverviewCard from './cards/OverviewCard'
import SnapshotsCard from './cards/SnapshotsCard'
import UtilizationCard from './cards/UtilizationCard'

import {
  VmDetailToolbar,
} from '_/components/Toolbar'

const VmDetailsContainer = ({ vm, msg }) => {
  const trackEditsRef = useRef({ edit: {} })

  const [anyDirtyEdit, setAnyDirtyEdit] = useState(false)
  const [showNavConfirm, setShowNavConfirm] = useState(false)
  const blocker = useBlocker(anyDirtyEdit)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowNavConfirm(true)
    }
  }, [blocker.state])

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!anyDirtyEdit) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [anyDirtyEdit])

  const confirmNavigation = useCallback(() => {
    setShowNavConfirm(false)
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker])

  const cancelNavigation = useCallback(() => {
    setShowNavConfirm(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  const handleEditChange = useCallback((card, isEdit, isDirty = false) => {
    const cardEdit = trackEditsRef.current.edit[card] || {}
    cardEdit.edit = isEdit
    cardEdit.dirty = isDirty

    const edit = { ...trackEditsRef.current.edit, [card]: cardEdit }
    const nextAnyDirtyEdit = Object.entries(edit).reduce((acc, [, value]) => acc || !!value.dirty, false)

    trackEditsRef.current = { edit, anyDirtyEdit: nextAnyDirtyEdit }
    if (!nextAnyDirtyEdit !== !anyDirtyEdit) {
      setAnyDirtyEdit(nextAnyDirtyEdit)
    }
  }, [anyDirtyEdit])

  return (
    <div>
      <VmDetailToolbar/>
      <Grid className={styles['details-container']}>
        <NavigationConfirmationModal
          show={showNavConfirm}
          onYes={confirmNavigation}
          onNo={cancelNavigation}
        />

        {vm.get('nextRunExists') && (
          <Row>
            <Col>
              <Card style={{ marginBottom: '20px' }}>
                <CardBody>
                  <Hint>
                    <HintBody>
                      {msg.vmHasPendingConfigurationChanges()}
                    </HintBody>
                  </Hint>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}

        <Row>
          <Col cols={4} className={styles['col-overview']}><OverviewCard vm={vm} onEditChange={(isEdit, isDirty) => handleEditChange('over', isEdit, isDirty)} /></Col>
          <Col cols={5} className={styles['col-details']}><DetailsCard vm={vm} onEditChange={(isEdit, isDirty) => handleEditChange('detail', isEdit, isDirty)} /></Col>
          <Col cols={3} className={styles['col-snapshots']}><SnapshotsCard vm={vm} onEditChange={(isEdit, isDirty) => handleEditChange('snap', isEdit, isDirty)} /></Col>
        </Row>
        <Row>
          <Col cols={9} className={styles['col-utilization']}><UtilizationCard vm={vm} /></Col>
          <Col cols={3} className={styles['col-nics-disks']}>
            <NicsCard vm={vm} onEditChange={(isEdit, isDirty) => handleEditChange('nic', isEdit, isDirty)} />
            <DisksCard className={styles['col-disks']} vm={vm} onEditChange={(isEdit, isDirty) => handleEditChange('disk', isEdit, isDirty)} />
          </Col>
        </Row>
      </Grid>
    </div>
  )
}

VmDetailsContainer.propTypes = {
  vm: PropTypes.object,
  msg: PropTypes.object.isRequired,
}

export default withMsg(VmDetailsContainer)
