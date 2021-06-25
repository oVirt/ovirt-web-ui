import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import AppConfiguration from '_/config'
import { startSchedulerFixedDelay } from '_/actions'

const RefreshIntervalChangeHandler = ({ refreshInterval, currentPage, restartScheduler }) => {
  const [ currentRefresh, setCurrentRefresh ] = useState(refreshInterval)

  useEffect(() => {
    if (currentRefresh !== refreshInterval) {
      console.log(`Detected refreshInterval change - current: ${currentRefresh}, new: ${refreshInterval}`)
      setCurrentRefresh(refreshInterval)
      restartScheduler(refreshInterval, currentPage)
    }
  }, [ currentRefresh, refreshInterval ])

  return null
}

RefreshIntervalChangeHandler.propTypes = {
  refreshInterval: PropTypes.number.isRequired,
  currentPage: PropTypes.object.isRequired,
  restartScheduler: PropTypes.func.isRequired,
}

export default connect(
  ({ options, config }) => ({
    refreshInterval: options.getIn(['remoteOptions', 'refreshInterval', 'content'], AppConfiguration.schedulerFixedDelayInSeconds),
    currentPage: config.get('currentPage'),
  }),
  dispatch => ({
    restartScheduler: (refreshInterval, targetPage) =>
      dispatch(startSchedulerFixedDelay({ delayInSeconds: refreshInterval, targetPage })),
  })
)(RefreshIntervalChangeHandler)
