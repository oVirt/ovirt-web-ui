import { useEffect } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { locale as mergedLocale } from '_/intl'

const LocaleReloader = ({ children, localeFromStore, loadingFinished }) => {
  /* Basic flow:
   * 1. after language settings change the value is saved on the server, in the Redux store and local store
   * 2. value from the Redux store is passed via props and is used to trigger useEffect hook
   * 3. in the hook the change is detected by comparing static resources with Redux store
   * 4. if detected, the locales change requires (currently) page reload to regenerate static i18n resources i.e. global "msg" object
   * 5. after the reload both Redux store and custom i18n resources use the same locales
   * 6. static resources are used directly i.e. by calling msg.someLabel() in the components
   * Special cases:
   * 1. locale provided by URL (<server>/?locale=en_US) and cookie is used only if there is no locale in the local storage (which
   *    indicates that there is no locales persisted on the server).
   * 2. updating the language while still on user setting page - the reload should wait until user sees success confirmation.
   *    If the reload is triggered too early, the browser will display a warning dialog "are you sure you want to reload,
   *    you changes will be lost". Ready for reload state is detected by watching loadingFinished flag.
   * 3. fist run(no data in local storage) - UI will try to gues user locale. When user settings will be fetched
   *    from the server and incorrect locale was guessed then an additional reload will happen.
   * 4. no property on server exists but UI was launched using non-default locale(i.e. from local storage or URL) - save that locale on the server.
   */
  useEffect(() => {
    if (loadingFinished && localeFromStore !== mergedLocale) {
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
