import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import { saveGlobalOptions } from '_/actions'
import { FormControl } from 'patternfly-react'
import { Switch, Nav, NavItem, NavList, Split, SplitItem } from '@patternfly/react-core'
import { withMsg, localeWithFullName, DEFAULT_LOCALE } from '_/intl'
import style from './style.css'

import { Settings, SettingsBase } from '../Settings'
import SelectBox from '../SelectBox'
import moment from 'moment'
import AppConfiguration from '_/config'
import { BROWSER_VNC, NATIVE_VNC, SPICE, RDP } from '_/constants/console'

const GENERAL_SECTION = 'general'

class GlobalSettings extends Component {
  dontDisturbList (msg) {
    return [
      {
        id: 10,
        value: moment.duration(10, 'minutes').humanize(),
      },
      {
        id: 60,
        value: moment.duration(1, 'hours').humanize(),
      },
      {
        id: 60 * 24,
        value: moment.duration(1, 'days').humanize(),
      },
      {
        id: Number.MAX_SAFE_INTEGER,
        value: msg.untilNextPageReload(),
      },
    ]
  }

  refreshIntervalList (msg) {
    return [
      {
        id: 30,
        value: msg.every30Seconds(),
      },
      {
        id: 60,
        value: msg.everyMinute(),
      },
      {
        id: 120,
        value: msg.every2Minute(),
      },
      {
        id: 300,
        value: msg.every5Minute(),
      },
    ]
  }

  preferredConsoleList (msg) {
    return [
      {
        id: NATIVE_VNC,
        value: msg.vncConsole(),
      },
      {
        id: BROWSER_VNC,
        value: msg.vncConsoleBrowser(),
      },
      {
        id: SPICE,
        value: msg.spiceConsole(),
      },
      {
        id: RDP,
        value: msg.remoteDesktop(),
      },
    ]
  }

  constructor (props) {
    super(props)
    const { config } = props
    /**
     * Typical flow (happy path):
     * 1. at the begining:
     *    baseValues == draftValues == currentValues
     * 2. after user edit:
     *    baseValues == currentValues
     *    BUT
     *    baseValues != draftValues
     * 3. after 'save' but before action finished:
     *    baseValues == currentValues
     *    AND
     *    baseValue + sentValues == draftValues
     * 4. successful 'save' triggers re-basing (back to step 1.)
     */
    this.state = {
      // editable by the user (used by the widgets)
      // represent the current state of user work
      draftValues: {
        ...props.currentValues,
      },
      // state before editing
      // allows to detect changes by comparing values (baseValues - draftValues == changes)
      // note that it's perfectly legal to have: baseValues != currentValues
      // store can change i.e. after fetching data from the server
      // or after some action i.e. 'do not disturb' expired
      baseValues: {
        ...props.currentValues,
      },
      // values submitted using 'save' action
      // inlcude both remote(server and store) or local(store only)
      sentValues: {},
      activeSectionKey: GENERAL_SECTION,
      defaultValues: {
        language: DEFAULT_LOCALE,
        showNotifications: AppConfiguration.showNotificationsDefault,
        refreshInterval: AppConfiguration.schedulerFixedDelayInSeconds,
        notificationSnoozeDuration: AppConfiguration.notificationSnoozeDurationInMinutes,
        persistLocale: AppConfiguration.persistLocale,
        fullScreenVnc: false,
        fullScreenSpice: false,
        ctrlAltEndVnc: false,
        ctrlAltEndSpice: false,
        preferredConsole: config.defaultUiConsole,
        smartcardSpice: AppConfiguration.smartcardSpice,
      },
    }
    this.handleCancel = this.handleCancel.bind(this)
    this.buildSections = this.buildSections.bind(this)
    this.saveOptions = this.saveOptions.bind(this)
    this.resetBaseValues = this.resetBaseValues.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onReset = this.onReset.bind(this)
  }

  resetBaseValues () {
    const { currentValues } = this.props
    this.setState({
      sentValues: {},
      baseValues: { ...currentValues },
    })
  }

  saveOptions (values, transactionId) {
    this.props.saveOptions(values, transactionId)
    this.setState({
      sentValues: { ...values },
    })
  }

  handleCancel () {
    this.props.goToMainPage()
  }

  onChange (field) {
    return (value) => {
      this.setState((state) => ({
        draftValues: {
          ...state.draftValues,
          [field]: value,
        },
      }))
    }
  }
  onReset (saveFields, id) {
    this.setState(state => ({
      draftValues: {
        ...this.props.currentValues,
        ...state.defaultValues,
      },
    }))
    this.saveOptions(saveFields, id)
  }

  buildSections (onChange) {
    const { draftValues } = this.state
    const { config, msg } = this.props
    const idPrefix = 'global-user-settings'
    return {
      [GENERAL_SECTION]: {
        title: msg.general(),
        fields: [
          ((name) => ({
            title: msg.username(),
            name,
            body: <span>{config[name]}</span>,
          }))('userName'),
          ((name) => ({
            title: msg.email(),
            name,
            body: <span>{config[name]}</span>,
          }))('email'),
          ((name) => ({
            title: msg.language(),
            name,
            tooltip: draftValues.persistLocale ? undefined : msg.optionIsNotSavedOnTheServer({ persistenceReEnableHowTo: msg.persistenceReEnableHowTo({ advancedOptions: msg.advancedOptions() }) }),
            body: (
              <div className={style['half-width']}>
                <SelectBox
                  id={`${idPrefix}-${name}`}
                  items={Object.entries(localeWithFullName).map(([id, value]) => ({ id, value, isDefault: id === DEFAULT_LOCALE }))}
                  selected={draftValues[name]}
                  onChange={onChange(name)}
                />
              </div>
            ),
          }))('language'),
        ],
      },
      refreshInterval: {
        title: msg.refreshInterval(),
        tooltip: msg.refreshIntervalTooltip(),
        fields: [
          ((name) => ({
            title: msg.uiRefresh(),
            name,
            body: (
              <div className={style['half-width']}>
                <SelectBox
                  id={`${idPrefix}-${name}`}
                  items={this.refreshIntervalList(msg)
                    .map(({ id, value }) => ({ id, value, isDefault: id === AppConfiguration.schedulerFixedDelayInSeconds }))}
                  selected={draftValues[name]}
                  onChange={onChange(name)}
                />
              </div>
            ),
          }))('refreshInterval'),
        ],
      },
      notifications: {
        title: msg.notifications(),
        tooltip: msg.notificationSettingsAffectAllNotifications(),
        fields: [
          ((name) => ({
            title: msg.dontDisturb(),
            name,
            body: (
              <Switch
                id={`${idPrefix}-${name}`}
                isChecked={!draftValues[name]}
                onChange={(dontDisturb) => {
                  onChange(name)(!dontDisturb)
                }}
              />
            ),
          }))('showNotifications'),
          ((name) => ({
            title: msg.dontDisturbFor(),
            name,
            body: (
              <div className={style['half-width']}>
                <SelectBox
                  id={`${idPrefix}-${name}`}
                  items={this.dontDisturbList(msg)
                    .map(({ id, value }) => ({ id, value, isDefault: id === AppConfiguration.notificationSnoozeDurationInMinutes }))}
                  selected={draftValues[name]}
                  onChange={onChange(name)}
                  disabled={draftValues.showNotifications}
                />
              </div>
            ),
          }))('notificationSnoozeDuration'),
        ],
      },
      console: {
        title: msg.console(),
        fields: [ ],
        sections: {
          console: {
            title: msg.console(),
            tooltip: msg.globalSettingsTooltip(),
            fields: [],
          },
          preferredConsole: {
            title: '',
            fields: [
              ((name) => ({
                title: msg.preferredConsole(),
                tooltip: msg.preferredConsoleTooltip(),
                name,
                body: (
                  <div className={style['half-width']}>
                    <SelectBox
                      id={`${idPrefix}-${name}`}
                      items={this.preferredConsoleList(msg)
                        .map(({ id, value }) => ({
                          id,
                          value,
                          isDefault: id === config.defaultUiConsole,
                        }))
                      }
                      selected={draftValues[name]}
                      onChange={onChange(name)}
                    />
                  </div>
                ),
              }))('preferredConsole'),
            ],
          },
          vnc: {
            title: msg.vncOptions(),
            fields: [
              ((name) => ({
                title: msg.fullScreenMode(),
                name,
                body: (
                  <Switch
                    id={`${idPrefix}-${name}`}
                    isChecked={draftValues[name]}
                    onChange={(fullScreen) => {
                      onChange(name)(fullScreen)
                    }}
                  />
                ),
              }))('fullScreenVnc'),
              ((name) => ({
                title: msg.ctrlAltEnd(),
                tooltip: msg.remapCtrlAltDelete(),
                name,
                body: (
                  <Switch
                    id={`${idPrefix}-${name}`}

                    isChecked={draftValues[name]}
                    onChange={(ctrlAltEnd) => {
                      onChange(name)(ctrlAltEnd)
                    }}
                  />
                ),
              }))('ctrlAltEndVnc'),
            ],
          },
          spice: {
            title: msg.spiceOptions(),
            fields: [
              ((name) => ({
                title: msg.fullScreenMode(),
                name,
                body: (
                  <Switch
                    id={`${idPrefix}-${name}`}
                    isChecked={draftValues[name]}
                    onChange={(fullScreen) => {
                      onChange(name)(fullScreen)
                    }}
                  />
                ),
              }))('fullScreenSpice'),
              ((name) => ({
                title: msg.ctrlAltEnd(),
                tooltip: msg.remapCtrlAltDelete(),
                name,
                body: (
                  <Switch
                    id={`${idPrefix}-${name}`}
                    isChecked={draftValues[name]}
                    onChange={(ctrlAltEnd) => {
                      onChange(name)(ctrlAltEnd)
                    }}
                  />
                ),
              }))('ctrlAltEndSpice'),
              ((name) => ({
                title: msg.smartcard(),
                tooltip: msg.smartcardTooltip(),
                name,
                body: (
                  <Switch
                    id={`${idPrefix}-${name}`}
                    isChecked={draftValues[name]}
                    onChange={(smartcard) => {
                      onChange(name)(smartcard)
                    }}
                  />
                ),
              }))('smartcardSpice'),
            ],
          },
          serial: {
            title: msg.serialConsoleOptions(),
            fields: [
              ((name) => ({
                title: msg.sshKey(),
                tooltip: msg.sshKeyTooltip(),
                name,
                body: (
                  <div className={style['half-width']}>
                    <FormControl
                      id={`${idPrefix}-${name}`}
                      componentClass='textarea'
                      onChange={e => onChange(name)(e.target.value)}
                      value={draftValues[name] || ''}
                      rows={8}
                    />
                  </div>
                ),
              }))('sshKey'),
            ],
          },
        },

      },
      advancedOptions: {
        title: msg.advancedOptions(),
        fields: [
          ((name) => ({
            title: msg.persistLanguage(),
            name,
            tooltip: msg.persistLanguageTooltip(),
            body: (<Switch
              id={`${idPrefix}-${name}`}
              isChecked={draftValues[name]}
              onChange={(persist) => onChange(name)(persist)}
            />),
          }))('persistLocale'),
        ],
      },
    }
  }

  render () {
    const { lastTransactionId, currentValues } = this.props
    const { draftValues, baseValues, sentValues, defaultValues, activeSectionKey } = this.state

    const sections = this.buildSections(this.onChange)
    const { [activeSectionKey]: activeSection } = sections
    // required in Settings for error handling and confirmation dialog
    // the alert/dialog need to show the translated field labels (together with section labels)
    // output: [ {sectionTitle: "globally unique + translated", fieldTitle: "translated", fieldName: "globally unique"}, ... ]}
    // NOTE that the order of section/fields is preserved here
    const translatedLabels = Object.values(sections)
      .flatMap(section => section.sections ? Object.values(section.sections) : section)
      .flatMap(({ title: sectionTitle, fields }) =>
        // assume global uniqueness of: fieldName, sectionTitle
        fields.map(({ name: fieldName, title: fieldTitle }) => ({ sectionTitle, fieldTitle, fieldName }))
      )

    const onSelect = result => {
      this.setState({
        activeSectionKey: result.itemId,
      })
    }

    return (
      <div className='container'>
        <Split hasGutter>
          <SplitItem>
            <Nav onSelect={onSelect} theme='light'>
              <NavList className={`card-pf global-settings-nav-list`}>
                { Object.entries(sections).map(([key, section]) =>
                  <NavItem className='border' itemId={key} key={key} isActive={activeSectionKey === key}>
                    {section.title}
                  </NavItem>)
                }
              </NavList>
            </Nav>
          </SplitItem>
          <SplitItem isFilled>
            <Settings
              draftValues={draftValues}
              baseValues={baseValues}
              currentValues={currentValues}
              sentValues={sentValues}
              translatedLabels={translatedLabels}
              lastTransactionId={lastTransactionId}
              resetBaseValues={this.resetBaseValues}
              onSave={this.saveOptions}
              onCancel={this.handleCancel}
              onReset={this.onReset}
              defaultValues={defaultValues}
            >
              <SettingsBase section={activeSection} name={activeSectionKey} />
            </Settings>
          </SplitItem>
        </Split>
      </div>
    )
  }
}

GlobalSettings.propTypes = {
  currentValues: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  lastTransactionId: PropTypes.string,
  saveOptions: PropTypes.func.isRequired,
  goToMainPage: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  ({ options, config }) => ({
    config: {
      userName: config.getIn(['user', 'name']),
      email: config.getIn(['user', 'email']),
      defaultUiConsole: config.getIn(['defaultUiConsole']),
    },
    currentValues: {
      sshKey: options.getIn(['ssh', 'key']),
      language: options.getIn(['remoteOptions', 'locale', 'content']),
      showNotifications: options.getIn(['localOptions', 'showNotifications']),
      notificationSnoozeDuration: options.getIn(['localOptions', 'notificationSnoozeDuration']),
      refreshInterval: options.getIn(['remoteOptions', 'refreshInterval', 'content']),
      persistLocale: options.getIn(['remoteOptions', 'persistLocale', 'content']),
      fullScreenVnc: options.getIn(['remoteOptions', 'fullScreenVnc', 'content']),
      fullScreenSpice: options.getIn(['remoteOptions', 'fullScreenSpice', 'content']),
      ctrlAltEndVnc: options.getIn(['remoteOptions', 'ctrlAltEndVnc', 'content']),
      ctrlAltEndSpice: options.getIn(['remoteOptions', 'ctrlAltEndSpice', 'content']),
      preferredConsole: options.getIn(['remoteOptions', 'preferredConsole', 'content'], config.getIn(['defaultUiConsole'])),
      smartcardSpice: options.getIn(['remoteOptions', 'smartcardSpice', 'content']),
    },
    lastTransactionId: options.getIn(['lastTransactions', 'global', 'transactionId'], ''),
  }),

  (dispatch) => ({
    saveOptions: (values, transactionId) => dispatch(saveGlobalOptions({ values }, { transactionId })),
    goToMainPage: () => dispatch(push('/')),
  })
)(withMsg(GlobalSettings))
