import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { matchRoutes } from 'react-router-config'

import {
  Link,
  withRouter,
  Redirect,
} from 'react-router-dom'

import { redirectRoute } from '../actions/route'

import style from './sharedStyle.css'

import Toolbar from './Toolbar/Toolbar'

import { msg } from '../intl'

const ROOT_URL = '/'

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

const findExactMatch = (branches) => {
  if (branches.length === 0) {
    return null
  } else if (branches.length === 1) {
    return branches[0]
  } else {
    for (let i = 0; i < branches.length; i++) {
      if (branches[i].match.isExact) {
        return branches[i]
      }
    }
    return branches[0]
  }
}

const propsToState = (props) => {
  const branches = matchRoutes(props.route.routes, props.location.pathname)
  return {
    branches,
    branch: findExactMatch(branches),
  }
}

class PageRouter extends React.Component {
  constructor (props) {
    super(props)
    this.state = Object.assign({
      previousPath: ROOT_URL,
    }, propsToState(props))

    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  handleKeyUp (event) {
    if (event.key === 'Escape' && this.state.branch.route.closeable) {
      const branches = this.state.branches
      const len = branches.length
      let url

      if (len === 1) {
        if (branches[0].match.url !== ROOT_URL) {
          url = ROOT_URL
        }
      } else if (len > 1) {
        url = branches[len - 2].match.url
      }

      if (url) {
        this.props.history.push(url)
      }
    }
  }

  componentDidUpdate () {
    if (this.props.redirect && this.props.redirect !== this.props.location.pathname) {
      this.props.onRedirect()
    }
  }

  componentDidMount () {
    document.addEventListener('keyup', this.handleKeyUp)
  }

  componentWillUnmount () {
    document.removeEventListener('keyup', this.handleKeyUp)
  }

  componentWillReceiveProps (nextProps) {
    const newState = propsToState(nextProps)

    if (this.state.previousPath !== this.props.location.pathname && location.pathname !== this.props.location.pathname) {
      newState.previousPath = this.props.location.pathname
    }
    this.setState(newState)
  }

  render () {
    const { location, history, redirect } = this.props

    if (redirect && redirect !== location.pathname) {
      return (<Redirect to={redirect} />)
    }

    const branch = this.state.branch
    if (!branch) {
      return null
    }

    const tools = []
    for (let i in branch.route.toolbars) {
      tools.push(branch.route.toolbars[i](branch.match))
    }

    const RenderComponent = branch.route.component
    return (<div className={style['page-router']}>
      <Breadcrumb route={this.state.branches} root={{ title: msg.virtualMachines(), url: '/' }} />
      <Toolbar>
        {tools}
      </Toolbar>
      <div className={style['page-router-render-component']}>
        <RenderComponent route={branch.route} match={branch.match} location={location} history={history} previousPath={this.state.previousPath} />
      </div>
    </div>)
  }
}

PageRouter.propTypes = {
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  /* eslint-disable-next-line react/no-unused-prop-types */
  route: PropTypes.object.isRequired,
  redirect: PropTypes.object, // can be null
  onRedirect: PropTypes.func.isRequired,
}

export default withRouter(connect(
  (state) => ({
    redirect: state.route.get('redirect'),
  }),
  (dispatch) => ({
    onRedirect: () => dispatch(redirectRoute({ route: null })),
  })
)(PageRouter))
