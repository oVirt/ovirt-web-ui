import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import style from './style.css'

const isActionInProgress = ({ vms, pools }) => {
  const vmsActions = vms.filter((v) =>
    v.get('actionInProgress') && !v.get('actionInProgress').filter((start) => !!start).isEmpty()
  )

  const poolsActions = pools.filter((v) =>
    v.get('actionInProgress') && !v.get('actionInProgress').filter((start) => !!start).isEmpty()
  )

  return !vmsActions.isEmpty() || !poolsActions.isEmpty()
}

const isLoadInProgress = ({ vms }) => {
  const isLoadInProgress = !!vms.get('loadInProgress')
  const isAIP = isActionInProgress({ vms: vms.get('vms'), pools: vms.get('pools') })

  return isLoadInProgress || isAIP
}

/**
 * The user is informed about communication with server when
 * - data is being initially loaded
 * - waiting for an action
 * - load after Refresh button
 * - refreshing data when VM detail is opened
 *
 * Regular polling does not lead to rendering this "Loading ..." message.
 */
const LoadingData = ({ vms }) => {
  if (!isLoadInProgress({ vms })) {
    return null
  }

  return (
    <div className={`alert alert-warning ${style['loading-data']}`}>
      <strong>Loading ...</strong>
    </div>)
}
LoadingData.propTypes = {
  vms: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
  })
)(LoadingData)
