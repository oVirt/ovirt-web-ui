import { useEffect } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { withMsg } from '_/intl'
import OvirtApi from '_/ovirtapi'

const LocaleReloader = ({ children, localeFromStore, locale, reloadMsg }) => {
  /* Basic flow:
   * 1. after language settings change the value is saved on the server and in the Redux store
   * 2. value from the Redux store is passed via props and is used to trigger useEffect hook
   * 3. in the hook the change is detected by comparing value from MsgContext with Redux store
   * 4. if detected, the locale are regenerated and served via MsgContext
   * Special cases:
   * 1. locale provided by URL <server>/?locale=en_US (or inferred from browser settings) is used only if there is no locale persisted on the server (or if locale persistence is disabled).
   * 2. no data from the server (yet) - UI will try to gues user locale. When user settings will be fetched
   *    from the server and incorrect locale was guessed then locale will get hot-reloaded.
   * 3. no property on server exists but UI was launched using non-default locale(i.e. from URL) - save that locale on the server(unless locale persistence is disabled).
   */
  useEffect(() => {
    if (localeFromStore !== locale) {
      console.warn(`reload due to locale change: ${locale} -> ${localeFromStore}`)
      reloadMsg(localeFromStore)
    }
  }, [localeFromStore, locale, reloadMsg])

  useEffect(() => {
    OvirtApi.updateLocale(locale)
  }, [locale])

  return ([ children ])
}

LocaleReloader.propTypes = {
  children: PropTypes.node,
  localeFromStore: PropTypes.string.isRequired,
  reloadMsg: PropTypes.func.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  state => ({
    localeFromStore: state.options.getIn(['remoteOptions', 'locale', 'content']),
  })
)(withMsg(LocaleReloader))
