import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { matchRoutes } from 'react-router-config'
import { Link, withRouter } from 'react-router-dom'
import { push } from 'connected-react-router'

import { msg } from '../intl'

import style from './sharedStyle.css'
import Toolbar from './Toolbar/Toolbar'

const buildPath = (route) => {
  let res = []
  for (let i in route) {
    if (typeof route[i].route.title === 'function') {
      res.push({ title: route[i].route.title(route[i].match), url: route[i].match.url })
    } else {
      if (typeof route[i].route.title === 'string') {
        res.push({ title: route[i].route.title, url: route[i].match.url })
      }
    }
  }
  return res
}

const Breadcrumb = ({ route, root }) => {
  let pathArray = buildPath(route)
  pathArray = [ root ].concat(pathArray)
  const idPrefix = `breadcrumb`
  const breadcrumbPaths = []
  for (let i = 0; i < pathArray.length; i++) {
    if ((i + 1) === pathArray.length) {
      breadcrumbPaths.push(<li key={pathArray[i].url} className='active' id={`${idPrefix}-last-${i}`}>{pathArray[i].title}</li>)
    } else {
      breadcrumbPaths.push(<li key={pathArray[i].url}><Link to={pathArray[i].url} id={`${idPrefix}-link-${i}`}>{pathArray[i].title}</Link></li>)
    }
  }

  return (<ol className={`breadcrumb ${style['breadcrumb']}`}>
    {breadcrumbPaths}
  </ol>)
}

Breadcrumb.propTypes = {
  route: PropTypes.array.isRequired,
  root: PropTypes.object.isRequired,
}

const findExactOrOnlyMatch = (branches) => {
  return branches.length === 1
    ? branches[0]
    : branches.find(branch => branch.match.isExact) || null
}

class PageRouter extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      previousPath: '/',
      currentPath: null,

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

  static getDerivedStateFromProps ({ location, route }, { currentPath, previousPath }) {
    const newPath = location.pathname
    const updates = {}

    if (currentPath !== newPath) {
      updates.branches = matchRoutes(route.routes, location.pathname)
      updates.branch = findExactOrOnlyMatch(updates.branches)
      updates.closeable = !!updates.branch.route.closeable

      updates.currentPath = newPath
      if (previousPath !== currentPath) {
        updates.previousPath = currentPath
      }
    }

    return Object.keys(updates).length > 0 ? updates : null
  }

  render () {
    const { location, history } = this.props
    const { previousPath, branches, branch } = this.state

    const tools = []
    if (branch && branch.route.toolbars) {
      for (const toolbarBuilder of branch.route.toolbars) {
        tools.push(toolbarBuilder(branch.match))
      }
    }

    const RenderComponent = branch.route.component
    return (
      <div className={style['page-router']}>
        <Breadcrumb route={branches} root={{ title: msg.virtualMachines(), url: '/' }} />
        <Toolbar>
          {tools}
        </Toolbar>
        <div className={style['page-router-render-component']}>
          <RenderComponent route={branch.route} match={branch.match} location={location} history={history} previousPath={previousPath} />
        </div>
      </div>
    )
  }
}

PageRouter.propTypes = {
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,

  navigationHandler: PropTypes.func.isRequired,
}

/*
 * PageRouter gets props from react-router and uses redux actions for navigation
 */
export default withRouter(
  connect(
    undefined,
    dispatch => ({
      navigationHandler: (newPath) => dispatch(push(newPath)),
    })
  )(PageRouter)
)
