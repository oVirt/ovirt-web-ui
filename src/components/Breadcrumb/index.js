import React, { useContext, useMemo } from 'react'
import { Link, useMatches } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MsgContext } from '_/intl'
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core'

import styles from './styles.css'

const PageBreadcrumb = () => {
  const { msg } = useContext(MsgContext)
  const matches = useMatches()
  const vms = useSelector(state => state.vms)
  const crumbs = useMemo(() => {
    const rawCrumbs = []

    matches.forEach((match) => {
      const context = {
        msg,
        vms,
        params: match.params,
        pathname: match.pathname,
      }

      const extraBreadcrumbs = match.handle?.extraBreadcrumbs
      if (extraBreadcrumbs) {
        const extraCrumbs = typeof extraBreadcrumbs === 'function' ? extraBreadcrumbs(context) : extraBreadcrumbs
        extraCrumbs?.forEach((extraCrumb) => {
          if (extraCrumb?.label) {
            rawCrumbs.push(extraCrumb)
          }
        })
      }

      const breadcrumb = match.handle?.breadcrumb
      if (!breadcrumb) {
        return
      }

      const crumb = typeof breadcrumb === 'function' ? breadcrumb(context) : breadcrumb
      if (crumb?.label) {
        rawCrumbs.push({ ...crumb, to: crumb.to ?? match.pathname })
      }
    })

    return rawCrumbs.filter((crumb, index, arr) => {
      if (index === 0) {
        return true
      }
      const prev = arr[index - 1]
      return !(prev.label === crumb.label && prev.to === crumb.to)
    })
  }, [matches, msg, vms])

  if (crumbs.length === 0) {
    return null
  }

  const idPrefix = 'breadcrumb'
  const lastSegment = crumbs[crumbs.length - 1]
  const parentCrumbs = crumbs.slice(0, -1)

  return (
    <Breadcrumb className={styles.breadcrumb}>
      {parentCrumbs.map((path, index) => (
        <BreadcrumbItem
          key={`${index}-${path.to}`}
          id={`${idPrefix}-last-${index}`}
          component="span"
        >
          <Link to={path.to} id={`${idPrefix}-link-${index}`}>
            {path.icon ? <path.icon style={{ marginRight: '0.4rem' }} /> : null}
            {path.label}
          </Link>
        </BreadcrumbItem>
      ))}

      <BreadcrumbItem isActive>
        {lastSegment.icon ? <lastSegment.icon style={{ marginRight: '0.4rem' }} /> : null}
        {lastSegment.label}
      </BreadcrumbItem>
    </Breadcrumb>
  )
}

export default PageBreadcrumb
