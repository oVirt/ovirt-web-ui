// @flow

import AppConfiguration from './config'
import { msg } from '_/intl'

let loaded: ?Promise<void>

function getBrandedResourceUrl (resourceId: string): string {
  const separator = AppConfiguration.applicationURL.endsWith('/')
    ? ''
    : '/'
  return `${AppConfiguration.applicationURL}${separator}branding/${resourceId}`
}

export const resourcesUrls = {
  get favicon (): string { return getBrandedResourceUrl('images/favicon.ico') },
  get clearGif (): string { return getBrandedResourceUrl('images/clear.cache.gif') },
  get baseStylesheet (): string { return getBrandedResourceUrl('style.css') },
  get brandStylesheet (): string { return getBrandedResourceUrl('brand.css') },
  get fixedStrings (): string { return getBrandedResourceUrl('fixed-strings.json') },
  get errorImg (): string { return getBrandedResourceUrl('images/ovirt_lost_map.png') },
}

export function loadOnce (): Promise<void> {
  if (!loaded) {
    loaded = fetch(resourcesUrls.fixedStrings, { credentials: 'include' })
      .then(body => body.json())
      .then(json => {
        console.log('___json before', json)
        const translatedStrings = {
          ...json,
          BRAND_NAME: msg[json.BRAND_NAME](),
          LEGAL_INFO_LINK_TEXT: msg[json.LEGAL_INFO_LINK_TEXT](),
          ISSUES_TRACKER_TEXT: msg[json.ISSUES_TRACKER_TEXT](),
        }

        if (json.LEGAL_INFO) {
          translatedStrings.LEGAL_INFO = msg[json.LEGAL_INFO]()
        }

        fixedStrings = Object.freeze(translatedStrings)
      })
      .catch(error => console.error(`'${resourcesUrls.fixedStrings}' cannot be loaded.`, error))
  }
  return loaded
}

export let fixedStrings: {|
  BRAND_NAME: string,
  LEGAL_INFO: string,
  LEGAL_INFO_LINK_TEXT: string,
  LEGAL_INFO_LINK_URL: string
|}
