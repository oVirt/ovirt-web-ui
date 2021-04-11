import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { msg } from '_/intl'

const NONE_VM_ROUTES = [ '/settings' ]

const buildPath = (vms, branches) => {
  const res = []
  const isVmPath = !branches.find(branch => NONE_VM_ROUTES.includes(branch.match.path))

  for (const branch of branches) {
    if (typeof branch.route.title === 'function') {
      res.push({
        title: branch.route.title(branch.match, vms),
        url: branch.match.url,
      })
    } else if (typeof branch.route.title === 'string') {
      res.push({
        title: branch.route.title,
        url: branch.match.url,
      })
    }
    const { match: { path = '' } = {} } = branch
    if (isVmPath && ['/'].includes(path)) {
      res.push({
        title: msg.virtualMachines(),
        url: '/',
      })
    }
  }

  return res
}

const Breadcrumb = ({ vms, branches }) => {
  const crumbs = buildPath(vms, branches)
  const idPrefix = `breadcrumb`

  return (
    <ol className='breadcrumb'>
      {crumbs.map((path, index, array) =>
        (index === (array.length - 1)) ? (
          <li key={`${index}-${path.url}`} className='active' id={`${idPrefix}-last-${index}`}>
            {path.title}
          </li>
        ) : (
          <li key={`${index}-${path.url}`}>
            <Link to={path.url} id={`${idPrefix}-link-${index}`}>{path.title}</Link>
          </li>
        )
      )}
    </ol>
  )
}
Breadcrumb.propTypes = {
  branches: PropTypes.array.isRequired,
  vms: PropTypes.object.isRequired,
}

export default connect(
  state => ({
    vms: state.vms,
  })
)(Breadcrumb)
