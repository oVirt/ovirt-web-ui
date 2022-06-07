import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { MsgContext } from '_/intl'
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core'

import styles from './styles.css'

const NONE_VM_ROUTES = ['/settings']

const buildPath = ({ vms, branches, msg }) => {
  const res = []
  const isVmPath = !branches.find(branch => NONE_VM_ROUTES.includes(branch.match.path))

  for (const branch of branches) {
    if (typeof branch.route.title === 'function') {
      res.push({
        title: branch.route.title({ match: branch.match, vms, msg }),
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

const PageBreadcrumb = ({ vms, branches }) => {
  const { msg } = useContext(MsgContext)
  const crumbs = buildPath({ vms, branches, msg })
  const idPrefix = 'breadcrumb'
  const lastSegment = crumbs.pop()
  return (

    <Breadcrumb className={styles.breadcrumb}>
      {
      crumbs.map((path, index, array) => (
        <BreadcrumbItem
          key={`${index}-${path.url}`}
          id={`${idPrefix}-last-${index}`}
          component="span"
        >
          <Link to={path.url} id={`${idPrefix}-link-${index}`}>{path.title}</Link>
        </BreadcrumbItem>
      ))
      }

      <BreadcrumbItem
        isActive
      >
        {lastSegment.title}
      </BreadcrumbItem>

    </Breadcrumb>
  )
}
PageBreadcrumb.propTypes = {
  branches: PropTypes.array.isRequired,
  vms: PropTypes.object.isRequired,
}

export default connect(
  state => ({
    vms: state.vms,
  })
)(PageBreadcrumb)
