import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import { saveGlobalOptions } from '_/actions'
import { FormControl } from 'patternfly-react'
import { Switch } from '@patternfly/react-core'
import { withMsg, localeWithFullName, DEFAULT_LOCALE } from '_/intl'
import style from './style.css'

import { Settings, SettingsBase } from '../Settings'
import SelectBox from '../SelectBox'
import moment from 'moment'
import AppConfiguration from '_/config'

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

  constructor (props) {
    super(props)
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
      defaultValues: {
        language: DEFAULT_LOCALE,
        showNotifications: AppConfiguration.showNotificationsDefault,
        refreshInterval: AppConfiguration.schedulerFixedDelayInSeconds,
        notificationSnoozeDuration: AppConfiguration.notificationSnoozeDurationInMinutes,
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

  buildSections (onChange, translatedLabels) {
    const { draftValues } = this.state
    const { config, msg } = this.props
    const idPrefix = 'global-user-settings'
    return {
      general: {
        title: msg.general(),
        fields: [
          {
            title: msg.username(),
            name: 'username',
            body: <span>{config.userName}</span>,
          },
          {
            title: msg.email(),
            name: 'email',
            body: <span>{config.email}</span>,
          },
          {
            title: translatedLabels.language,
            name: 'language',
            body: (
              <div className={style['half-width']}>
                <SelectBox
                  id={`${idPrefix}-language`}
                  items={Object.entries(localeWithFullName).map(([id, value]) => ({ id, value, isDefault: id === DEFAULT_LOCALE }))}
                  selected={draftValues.language}
                  onChange={onChange('language')}
                />
              </div>
            ),
          },
          {
            title: translatedLabels.sshKey,
            tooltip: msg.sshKeyTooltip(),
            name: 'sshKey',
            body: (
              <div className={style['half-width']}>
                <FormControl
                  id={`${idPrefix}-ssh-key`}
                  componentClass='textarea'
                  onChange={e => onChange('sshKey')(e.target.value)}
                  value={draftValues.sshKey || ''}
                  rows={8}
                />
              </div>
            ),
          },
        ],
      },
      refreshInterval: {
        title: msg.refreshInterval(),
        tooltip: msg.refreshIntervalTooltip(),
        fields: [
          {
            title: translatedLabels.refreshInterval,
            name: 'refreshInterval',
            body: (
              <div className={style['half-width']}>
                <SelectBox
                  id={`${idPrefix}-update-rate`}
                  items={this.refreshIntervalList(msg)
                    .map(({ id, value }) => ({ id, value, isDefault: id === AppConfiguration.schedulerFixedDelayInSeconds }))}
                  selected={draftValues.refreshInterval}
                  onChange={onChange('refreshInterval')}
                />
              </div>
            ),
          },
        ],
      },
      notifications: {
        title: msg.notifications(),
        tooltip: msg.notificationSettingsAffectAllNotifications(),
        fields: [
          {
            title: translatedLabels.showNotifications,
            name: 'showNotificatons',
            body: (
              <Switch
                id={`${idPrefix}-dont-disturb`}
                isChecked={!draftValues.showNotifications}
                onChange={(dontDisturb) => {
                  onChange('showNotifications')(!dontDisturb)
                }}
              />
            ),
          },
          {
            title: translatedLabels.notificationSnoozeDuration,
            name: 'notificationSnoozeDuration',
            body: (
              <div className={style['half-width']}>
                <SelectBox
                  id={`${idPrefix}-dont-disturb-for`}
                  items={this.dontDisturbList(msg)}
                  selected={draftValues.notificationSnoozeDuration}
                  onChange={onChange('notificationSnoozeDuration')}
                  disabled={draftValues.showNotifications}
                />
              </div>
            ),
          },
        ],
      },
    }
  }

  render () {
    const { lastTransactionId, currentValues, msg } = this.props
    const { draftValues, baseValues, sentValues, defaultValues } = this.state
    // required also in Settings for error handling: the case of partial success(only some fields saved)
    // the alert shows the names of the fields that were NOT saved
    const translatedLabels = {
      sshKey: msg.sshKey(),
      language: msg.language(),
      showNotifications: msg.dontDisturb(),
      notificationSnoozeDuration: msg.dontDisturbFor(),
      refreshInterval: msg.uiRefresh(),
    }

    return (
      <div className='container'>
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
          <SettingsBase sections={this.buildSections(this.onChange, translatedLabels)} />
        </Settings>
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
    },
    currentValues: {
      sshKey: options.getIn(['ssh', 'key']),
      language: options.getIn(['remoteOptions', 'locale', 'content']),
      showNotifications: options.getIn(['localOptions', 'showNotifications']),
      notificationSnoozeDuration: options.getIn(['localOptions', 'notificationSnoozeDuration']),
      refreshInterval: options.getIn(['remoteOptions', 'refreshInterval', 'content']),
    },
    lastTransactionId: options.getIn(['lastTransactions', 'global', 'transactionId'], ''),
  }),

  (dispatch) => ({
    saveOptions: (values, transactionId) => dispatch(saveGlobalOptions({ values }, { transactionId })),
    goToMainPage: () => dispatch(push('/')),
  })
)(withMsg(GlobalSettings))
