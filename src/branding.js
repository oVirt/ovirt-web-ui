// @flow

import AppConfiguration from './config'

let loaded: ?Promise<>

function getBrandedResourceUrl (resourceId: string): string {
  const separator = AppConfiguration.applicationURL.endsWith('/')
      ? ''
      : '/'
  return `${AppConfiguration.applicationURL}${separator}branding/${resourceId}`
}

export const resourcesUrls = {
  get favicon (): string { return getBrandedResourceUrl('favicon.ico') },
  get aboutDialogLogo (): string { return getBrandedResourceUrl('about-dialog-logo.png') },
  get stylesheet (): string { return getBrandedResourceUrl('style.css') },
  get fixedStrings (): string { return getBrandedResourceUrl('fixed-strings.json') },
}

export function loadOnce (): Promise<> {
  if (!loaded) {
    loaded = fetch(resourcesUrls.fixedStrings)
      .then(body => body.json())
      .then(json => {
        fixedStrings = Object.freeze(json)
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
