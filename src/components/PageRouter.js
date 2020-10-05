import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { matchRoutes } from 'react-router-config'
import { withRouter } from 'react-router-dom'
import { push } from 'connected-react-router'

import { RouterPropTypeShapes } from '../propTypeShapes'
import Breadcrumb from './Breadcrumb'
import { changePage, startSchedulerFixedDelay } from '../actions'
import AppConfiguration from '_/config'

const findExactOrOnlyMatch = (branches) => {
  return branches.length === 1 ? branches[0] : branches.find(branch => branch.match.isExact) || null
}

class PageRouter extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      previousPath: '/',
      currentPath: null,
      refreshInterval: props.refreshInterval,

      branches: [],
      branch: null,
      closeable: false,
    }

    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  handleKeyUp (event) {
    if (event.key === 'Escape' && this.state.closeable) {
      this.props.navigationHandler(this.state.previousPath)
    }
  }

  componentDidMount () {
    document.addEventListener('keyup', this.handleKeyUp)
  }

  componentWillUnmount () {
    document.removeEventListener('keyup', this.handleKeyUp)
  }

  static getDerivedStateFromProps (
    { location, route, onChangePage, refreshInterval, onRefreshIntervalChange },
    { currentPath, previousPath, refreshInterval: currentRefreshInterval, currentPage }
  ) {
    const newPath = location.pathname
    const updates = {}

    if (currentPath !== newPath) {
      updates.branches = matchRoutes(route.routes, location.pathname)
      updates.branch = findExactOrOnlyMatch(updates.branches)
      updates.closeable = !!updates.branch.route.closeable

      updates.currentPath = newPath
      if (currentPath && (previousPath !== currentPath)) {
        updates.previousPath = currentPath
      }
      onChangePage(updates.branch.route.type, updates.branch.match.params.id)
    }

    if (currentRefreshInterval !== refreshInterval) {
      console.log(`Detected refreshInterval change: prev=${currentRefreshInterval}, new=${refreshInterval}`)
      updates.refreshInterval = refreshInterval
      onRefreshIntervalChange(refreshInterval, currentPage)
    }

    return Object.keys(updates).length > 0 ? updates : null
  }

  render () {
    const { location, history } = this.props
    const { previousPath, branches, branch } = this.state

    const tools = branch && branch.route.toolbars && branch.route.toolbars(branch.match)
    const showBreadcrumb = branch && branch.route.breadcrumb !== false

    const RenderComponent = branch.route.component
    return (
      <div id='page-router'>
        {showBreadcrumb && <Breadcrumb branches={branches} />}
        {tools}
        <div id='page-router-render-component'>
          <RenderComponent route={branch.route} match={branch.match} location={location} history={history} previousPath={previousPath} />
        </div>
      </div>
    )
  }
}

PageRouter.propTypes = {
  match: RouterPropTypeShapes.match.isRequired, // eslint-disable-line react/no-unused-prop-types
  location: RouterPropTypeShapes.location.isRequired,
  history: RouterPropTypeShapes.history.isRequired,
  route: PropTypes.object.isRequired,
  refreshInterval: PropTypes.number.isRequired,

  navigationHandler: PropTypes.func.isRequired,
  onChangePage: PropTypes.func.isRequired,
  onRefreshIntervalChange: PropTypes.func.isRequired,

}

/*
 * PageRouter gets props from react-router and uses redux actions for navigation
 */
export default withRouter(
  connect(
    ({ options, config }) => ({
      refreshInterval: options.getIn(['remoteOptions', 'refreshInterval', 'content'], AppConfiguration.schedulerFixedDelayInSeconds),
      currentPage: config.get('currentPage'),
    }),
    dispatch => ({
      navigationHandler: (newPath) => dispatch(push(newPath)),
      onChangePage: (type, id) => dispatch(changePage({ type, id })),
      onRefreshIntervalChange: (refreshInterval, currentPage) => dispatch(startSchedulerFixedDelay({ delayInSeconds: refreshInterval, targetPage: currentPage })),
    })
  )(PageRouter)
)
