import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import { saveGlobalOptions } from '_/actions'
import {
  Switch,
  Nav,
  NavItem,
  NavList,
  Split,
  SplitItem,
  TextArea,
  Flex,
} from '@patternfly/react-core'
import { withMsg, localeWithFullName, DEFAULT_LOCALE } from '_/intl'
import style from './style.css'

import { Settings, SettingsBase } from '../Settings'
import SelectBox from '../SelectBox'
import moment from 'moment'
import AppConfiguration from '_/config'
import { BROWSER_VNC, NATIVE_VNC, SPICE, RDP } from '_/constants/console'
import VmSelect from './VmSelect'

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
        autoconnect: '',
        language: DEFAULT_LOCALE,
        showNotifications: AppConfiguration.showNotificationsDefault,
        refreshInterval: AppConfiguration.schedulerFixedDelayInSeconds,
        notificationSnoozeDuration: AppConfiguration.notificationSnoozeDurationInMinutes,
        persistLocale: AppConfiguration.persistLocale,
        fullScreenVnc: false,
        fullScreenNoVnc: false,
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
    const toId = (name) => `global-user-settings-${name}`
    return {
      [GENERAL_SECTION]: {
        title: msg.general(),
        fields: [
          ((name) => ({
            title: msg.username(),
            key: name,
            body: <span>{config[name]}</span>,
          }))('userName'),
          ((name) => ({
            title: msg.email(),
            key: name,
            body: <span>{config[name]}</span>,
          }))('email'),
          ((name) => ({
            title: msg.language(),
            key: name,
            tooltip: draftValues.persistLocale ? undefined : msg.optionIsNotSavedOnTheServer({ persistenceReEnableHowTo: msg.persistenceReEnableHowTo({ advancedOptions: msg.advancedOptions() }) }),
            fieldId: toId(name),
            body: (

              <SelectBox
                id={toId(name)}
                items={Object.entries(localeWithFullName).map(([id, value]) => ({ id, value, isDefault: id === DEFAULT_LOCALE }))}
                selected={draftValues[name]}
                onChange={onChange(name)}
              />

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
            key: name,
            fieldId: toId(name),
            body: (

              <SelectBox
                id={toId(name)}
                items={this.refreshIntervalList(msg)
                  .map(({ id, value }) => ({ id, value, isDefault: id === AppConfiguration.schedulerFixedDelayInSeconds }))}
                selected={draftValues[name]}
                onChange={onChange(name)}
              />

            ),
          }))('refreshInterval'),
        ],
      },
      notifications: {
        title: msg.notifications(),
        hint: msg.notificationSettingsAffectAllNotifications(),
        fields: [
          ((name) => ({
            key: name,
            confirmationLabel: msg.dontDisturb(),
            body: (
              <Switch
                id={toId(name)}
                label={msg.dontDisturb()}
                isChecked={!draftValues[name]}
                onChange={(dontDisturb) => {
                  onChange(name)(!dontDisturb)
                }}
              />
            ),
          }))('showNotifications'),
          ((name) => ({
            title: msg.dontDisturbFor(),
            key: name,
            fieldId: toId(name),
            body: (

              <SelectBox
                id={toId(name)}
                items={this.dontDisturbList(msg)
                  .map(({ id, value }) => ({ id, value, isDefault: id === AppConfiguration.notificationSnoozeDurationInMinutes }))}
                selected={draftValues[name]}
                onChange={onChange(name)}
                disabled={draftValues.showNotifications}
              />

            ),
          }))('notificationSnoozeDuration'),
        ],
      },
      console: {
        title: msg.console(),
        fields: [],
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
                key: name,
                fieldId: toId(name),
                body: (

                  <SelectBox
                    id={toId(name)}
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

                ),
              }))('preferredConsole'),
              ((name) => ({
                title: msg.connectAutomatically(),
                tooltip: msg.connectAutomaticallyTooltip(),
                key: name,
                fieldId: toId(name),
                body: (

                  <VmSelect
                    id={toId(name)}
                    selected={draftValues[name]}
                    onChange={vmId => onChange(name)(vmId)}
                  />

                ),
              }))('autoconnect'),
            ],
          },
          vnc: {
            title: msg.vncOptions(),
            fields: [
              ((name) => ({
                key: name,
                confirmationLabel: msg.fullScreenMode(),
                body: (
                  <Switch
                    id={toId(name)}
                    label={msg.fullScreenMode()}
                    isChecked={draftValues[name]}
                    onChange={(fullScreen) => {
                      onChange(name)(fullScreen)
                    }}
                  />
                ),
              }))('fullScreenVnc'),
              ((name) => ({
                tooltip: msg.remapCtrlAltDelete(),
                key: name,
                confirmationLabel: msg.ctrlAltEnd(),
                body: (
                  <Switch
                    id={toId(name)}
                    label={msg.ctrlAltEnd()}
                    isChecked={draftValues[name]}
                    onChange={(ctrlAltEnd) => {
                      onChange(name)(ctrlAltEnd)
                    }}
                  />
                ),
              }))('ctrlAltEndVnc'),
            ],
          },
          noVnc: {
            title: msg.noVncOptions(),
            fields: [
              ((name) => ({
                key: name,
                confirmationLabel: msg.fullScreenMode(),
                body: (
                  <Switch
                    id={toId(name)}
                    label={msg.fullScreenMode()}
                    isChecked={draftValues[name]}
                    onChange={(fullScreen) => {
                      onChange(name)(fullScreen)
                    }}
                  />
                ),
              }))('fullScreenNoVnc'),
            ],
          },
          spice: {
            title: msg.spiceOptions(),
            fields: [
              ((name) => ({
                key: name,
                confirmationLabel: msg.fullScreenMode(),
                body: (
                  <Switch
                    id={toId(name)}
                    label={msg.fullScreenMode()}
                    isChecked={draftValues[name]}
                    onChange={(fullScreen) => {
                      onChange(name)(fullScreen)
                    }}
                  />
                ),
              }))('fullScreenSpice'),
              ((name) => ({
                tooltip: msg.remapCtrlAltDelete(),
                key: name,
                confirmationLabel: msg.ctrlAltEnd(),
                body: (
                  <Switch
                    id={toId(name)}
                    label={msg.ctrlAltEnd()}
                    isChecked={draftValues[name]}
                    onChange={(ctrlAltEnd) => {
                      onChange(name)(ctrlAltEnd)
                    }}
                  />
                ),
              }))('ctrlAltEndSpice'),
              ((name) => ({
                tooltip: msg.smartcardTooltip(),
                key: name,
                confirmationLabel: msg.smartcard(),
                body: (
                  <Switch
                    id={toId(name)}
                    label={msg.smartcard()}
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
                key: name,
                fieldId: toId(name),
                fullSize: true,
                body: (
                  <TextArea
                    id={toId(name)}
                    onChange={value => onChange(name)(value)}
                    value={draftValues[name] || ''}
                    rows={8}
                    resizeOrientation='vertical'
                    aria-label={msg.sshKey()}
                  />
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
            key: name,
            tooltip: msg.persistLanguageTooltip(),
            confirmationLabel: msg.persistLanguage(),
            body: (<Switch
              id={toId(name)}
              label={msg.persistLanguage()}
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
        fields.map(({ key: fieldName, title: fieldTitle, confirmationLabel }) => ({
          sectionTitle,
          fieldTitle: fieldTitle || confirmationLabel,
          fieldName,
        }))
      )

    const onSelect = result => {
      this.setState({
        activeSectionKey: result.itemId,
      })
    }

    return (
      <Flex alignContent={{ default: 'alignItemsBaseline' }} justifyContent={{ default: 'justifyContentCenter' }}>

        <Split hasGutter className={style['half-width']}>
          <SplitItem>
            <Nav onSelect={onSelect} theme='light'>
              <NavList className='pf-c-card'>
                { Object.entries(sections).map(([key, section]) => (
                  <NavItem className={style.border} itemId={key} key={key} isActive={activeSectionKey === key}>
                    {section.title}
                  </NavItem>
                ))
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
      </Flex>
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
      autoconnect: options.getIn(['remoteOptions', 'autoconnect', 'content']),
      sshKey: options.getIn(['ssh', 'key']),
      language: options.getIn(['remoteOptions', 'locale', 'content']),
      showNotifications: options.getIn(['localOptions', 'showNotifications']),
      notificationSnoozeDuration: options.getIn(['localOptions', 'notificationSnoozeDuration']),
      refreshInterval: options.getIn(['remoteOptions', 'refreshInterval', 'content']),
      persistLocale: options.getIn(['remoteOptions', 'persistLocale', 'content']),
      fullScreenVnc: options.getIn(['remoteOptions', 'fullScreenVnc', 'content']),
      fullScreenNoVnc: options.getIn(['remoteOptions', 'fullScreenNoVnc', 'content']),
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
