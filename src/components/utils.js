// @flow

import Selectors from '../selectors'

import * as React from 'react'

/**
 * @param osName guest OS code name, e.g. 'rhel_7x64'
 * @return human friendly guest OS name, e.g. 'Red Hat Enterprise Linux 7.x x64'
 */
export function getOsHumanName (osName: string): string {
  const os = Selectors.getOperatingSystemByName(osName)
  return os && os.get('description') || osName
}

type PropertiesType = {
  children?: React.Node
}

/**
 * A react component allowing to return multiple elements.
 *
 * To be removed after upgrade to React 16.
 * @see https://reactjs.org/docs/fragments.html
 */
export const Fragment = (props: PropertiesType) => props.children
