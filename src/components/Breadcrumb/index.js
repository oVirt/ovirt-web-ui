import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { msg } from '../../intl'

const buildPath = (vms, branches) => {
  const res = []

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
  }

  return res
}

const root = {
  title: msg.virtualMachines(),
  url: '/',
}

const Breadcrumb = ({ vms, branches }) => {
  const crumbs = [ root, ...buildPath(vms, branches) ]
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
