import { useEffect } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { locale as mergedLocale, localeFromUrl } from '_/intl'

const LocaleReloader = ({ children, localeFromStore, loadingFinished }) => {
  /* Basic flow:
   * 1. after language settings change the value is saved on the server, in the Redux store and local store
   * 2. value from the Redux store is passed via props and is used to trigger useEffect hook
   * 3. in the hook the change is detected by comparing static resources with Redux store
   * 3. if detected, the locales change requires (currently) page reload to regenerate static i18n resources i.e. global "msg" object
   * 4. after the reload both Redux store and custom i18n resources use the same locales
   * 5. static resources are used directly i.e. by calling msg.someLabel() in the components
   * Special cases:
   * 1. locale provided by URL (<server>/?locale=en_US) - always takes precedence over user settings.
   *    Locale value passed to the starting page is stored in generated i18n resources.
   *    User can view and edit languge but it will have no effect until the locale parameter is removed from URL.
   *    TODO: pass the locale param to every sub-page (now it's visible only on a starting page)
   * 2. updating the language while still on user setting page - the reload should wait until user sees success confirmation.
   *    If the reload is triggered too early, the browser will display a warning dialog "are you sure you want to reload,
   *    you changes will be lost". Ready for reload state is detected by watching loadingFinished flag.
   * 3. fist run(no data in local storage) - UI will try to gues user locale. When user settings will be fetched
   *    from the server and incorrect locale was guessed then an additional reload will happen.
   */
  useEffect(() => {
    if (loadingFinished && localeFromStore !== mergedLocale && !localeFromUrl) {
      console.warn(`reload due to locale change: ${mergedLocale} -> ${localeFromStore}`)
      window.location.reload()
    }
  }, [localeFromStore, loadingFinished])
  return ([ children ])
}

LocaleReloader.propTypes = {
  children: PropTypes.node,
  localeFromStore: PropTypes.string.isRequired,
  loadingFinished: PropTypes.bool.isRequired,
}

export default connect(
  state => ({
    localeFromStore: state.options.getIn(['remoteOptions', 'locale', 'content']),
    loadingFinished: state.options.getIn(['loadingFinished'], false),
  })
)(LocaleReloader)
