import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { msg } from '../../intl'

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

const root = {
  title: msg.virtualMachines(),
  url: '/',
}

const Breadcrumb = ({ branches }) => {
  const crumbs = [ root, ...buildPath(branches) ]
  const idPrefix = `breadcrumb`
  // const noExactMatch = branches.length === 1 && !branches[0].route.path

  return (
    <ol className='breadcrumb'>
      {crumbs.map((path, index, array) =>
        (index === (array.length - 1)) ? (
          <li key={path.url} className='active' id={`${idPrefix}-last-${index}`}>
            {path.title}
          </li>
        ) : (
          <li key={path.url}>
            <Link to={path.url} id={`${idPrefix}-link-${index}`}>{path.title}</Link>
          </li>
        )
      )}
    </ol>
  )
}
Breadcrumb.propTypes = {
  branches: PropTypes.array.isRequired,
}

export default Breadcrumb
