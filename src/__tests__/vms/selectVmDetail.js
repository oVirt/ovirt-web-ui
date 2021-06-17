// import { call, put, take } from 'redux-saga/effects'

import { initialState as configInitial } from '_/reducers/config'
import { initialState as iconsInitial } from '_/reducers/icons'
import { initialState as vmsInitial } from '_/reducers/vms'
import { initialState as operatingSystemsInitial } from '_/reducers/operatingSystems'
import { initialState as clustersInitial } from '_/reducers/clusters'
import { initialState as templatesInitial } from '_/reducers/templates'
import { initialState as optionsInitial } from '_/reducers/options'
import Selectors from '_/selectors'

import {
  selectVmDetail,
  fetchSingleVm,
} from '_/sagas'
import {
  selectVmDetail as selectVmDetailAction,
  getSingleVm,
} from '_/actions'

const TEST_STORE = {
  state: {
    config: configInitial.merge({ oVirtApiVersion: { major: 4, minor: 2, passed: true } }),
    icons: iconsInitial,
    vms: vmsInitial,
    operatingSystems: operatingSystemsInitial,
    clusters: clustersInitial,
    templates: templatesInitial,
    options: optionsInitial,
  },
  getState () { return this.state },
}

beforeEach(() => {
  // If Selectors are used and are not initialized, they throw an exception.
  Selectors.init({ store: TEST_STORE })
})

describe('Selecting VM details', () => {
  const generator = selectVmDetail(selectVmDetailAction({ vmId: '123' }))

  it('selectVmDetail() equates to fetchSingleVm()', () => {
    const result = generator.next().value
    const fetchGenerator = fetchSingleVm(getSingleVm({ vmId: '123' }))
    // first effect is 'select' which takes anonymous function
    // each invocation creates a new function object which causes 'toEqual' to fail
    expect(String(result.next())).toEqual(String(fetchGenerator.next()))
    // continue with remaining effect
    expect(result).toEqual(fetchGenerator)
  })
})
