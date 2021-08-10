import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import AppConfiguration from '_/config'
import { startRefreshTimer } from '_/actions'

const RefreshIntervalChangeHandler = ({ refreshInterval, restartScheduler }) => {
  const [currentRefresh, setCurrentRefresh] = useState(refreshInterval)

  useEffect(() => {
    if (currentRefresh !== refreshInterval) {
      console.log(`Detected refreshInterval change - current: ${currentRefresh}, new: ${refreshInterval}`)
      setCurrentRefresh(refreshInterval)
      restartScheduler()
    }
  }, [currentRefresh, refreshInterval, restartScheduler])

  return null
}

RefreshIntervalChangeHandler.propTypes = {
  refreshInterval: PropTypes.number.isRequired,
  restartScheduler: PropTypes.func.isRequired,
}

export default connect(
  ({ options, config }) => ({
    refreshInterval: options.getIn(['remoteOptions', 'refreshInterval', 'content'], AppConfiguration.schedulerFixedDelayInSeconds),
  }),
  dispatch => ({
    restartScheduler: (refreshInterval) => dispatch(startRefreshTimer()),
  })
)(RefreshIntervalChangeHandler)
