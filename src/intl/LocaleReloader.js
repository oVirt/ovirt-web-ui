import { useEffect } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { withMsg, locale as inferredLocale } from '_/intl'
import OvirtApi from '_/ovirtapi'

const LocaleReloader = ({ children, localeFromStore, locale, reloadMsg, persistLocale }) => {
  /* Basic flow:
   * 1. after language settings change the value is saved on the server and in the Redux store
   * 2. value from the Redux store is passed via props and is used to trigger useEffect hook
   * 3. in the hook if the persistLanguage == true OR localeFromUrl == null: the change is detected by comparing value from MsgContext with Redux store.
   *    If the setting persistLanguage == false AND localeFromUrl != null: the change is detected by comparing value from MsgContext with localeFromUrl.
   * 4. if detected, the locale are regenerated and served via MsgContext
   * Special cases:
   * 1. locale provided by URL (<server>/?locale=en_US) and cookie is used if the persistLanguage value is equals to false.
   * 2. no data from the server (yet) - UI will try to gues user locale. When user settings will be fetched
   *    from the server and incorrect locale was guessed then locale will get hot-reloaded.
   * 3. no property on server exists but UI was launched using non-default locale(i.e. from URL) - save that locale on the server.
   */
  useEffect(() => {
    if (persistLocale) {
      if (localeFromStore !== locale) {
        console.warn(`reload due to locale change: ${locale} -> ${localeFromStore}`)
        reloadMsg(localeFromStore)
      }
    } else {
      if (inferredLocale !== locale) {
        console.warn(`reload due to locale change: ${locale} -> ${inferredLocale}`)
        reloadMsg(inferredLocale)
      }
    }
  }, [localeFromStore, locale, reloadMsg, persistLocale])

  useEffect(() => {
    OvirtApi.updateLocale(locale)
  }, [locale])

  return ([ children ])
}

LocaleReloader.propTypes = {
  children: PropTypes.node,
  localeFromStore: PropTypes.string,
  persistLocale: PropTypes.bool.isRequired,
  reloadMsg: PropTypes.func.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  state => ({
    localeFromStore: state.options.getIn(['remoteOptions', 'locale', 'content']),
    persistLocale: state.options.getIn(['remoteOptions', 'persistLocale', 'content']),
  })
)(withMsg(LocaleReloader))
