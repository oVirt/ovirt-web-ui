import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { getSinglePool, changePage, getByPage } from '_/actions'
import {
  CONSOLE_PAGE_TYPE,
  DETAIL_PAGE_TYPE,
  LIST_PAGE_TYPE,
  SETTINGS_PAGE_TYPE,
} from '_/constants'

import VmsList from '../VmsList'
import VmDetails from '../VmDetails'
import VmConsole from '../VmConsole'
import Handler404 from '_/Handler404'
import { GlobalSettings } from '../UserSettings'

/**
 * Route component (for PageRouter) to view the list of VMs and Pools
 */
const VmsListPage = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(changePage({ type: LIST_PAGE_TYPE }))
    // Also trigger an immediate fetch as fallback
    setTimeout(() => {
      dispatch(getByPage())
    }, 100)
  }, [dispatch])
  return <VmsList />
}

const GlobalSettingsPage = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(changePage({ type: SETTINGS_PAGE_TYPE }))
  }, [dispatch])
  return <GlobalSettings />
}

/**
 * Route component (for PageRouter) to view a VM's details
 */
const VmDetailsPage = () => {
  const dispatch = useDispatch()
  const { id: vmId } = useParams()
  const vms = useSelector(state => state.vms)

  useEffect(() => {
    dispatch(changePage({ type: DETAIL_PAGE_TYPE, id: vmId }))
  }, [dispatch, vmId])

  useEffect(() => {
    if (!vmId || !vms.getIn(['vms', vmId])) {
      return
    }

    const poolId = vms.getIn(['vms', vmId]).getIn(['pool', 'id'])
    if (poolId && !vms.getIn(['pools', poolId])) {
      dispatch(getSinglePool({ poolId }))
    }
  }, [dispatch, vmId, vms])

  if (vmId && vms.getIn(['vms', vmId])) {
    return (<VmDetails vm={vms.getIn(['vms', vmId])} />)
  }

  if (vms.get('missedVms').has(vmId)) {
    console.info(`VmDetailsPage: VM id cannot be found: ${vmId}`)
    return <Handler404 />
  }

  return null
}

/**
 * Route component (for PageRouter) to view a VM's console (with webVNC)
 */
const VmConsolePage = () => {
  const dispatch = useDispatch()
  const { id: vmId, consoleType } = useParams()
  const vms = useSelector(state => state.vms)

  useEffect(() => {
    dispatch(changePage({ type: CONSOLE_PAGE_TYPE, id: vmId }))
  }, [dispatch, vmId])

  if (vmId && vms.getIn(['vms', vmId])) {
    return <VmConsole consoleType={consoleType} vmId={vmId} />
  }

  return null
}

export {
  VmConsolePage,
  VmDetailsPage,
  VmsListPage,
  GlobalSettingsPage,
}
