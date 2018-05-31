// import { call, put, take } from 'redux-saga/effects'

import { initialState as configInitial } from '../../src/reducers/config'
import { initialState as iconsInitial } from '../../src/reducers/icons'
import { initialState as vmsInitial } from '../../src/reducers/vms'
import { initialState as operatingSystemsInitial } from '../../src/reducers/operatingSystems'
import { initialState as clustersInitial } from '../../src/reducers/clusters'
import { initialState as templatesInitial } from '../../src/reducers/templates'
import { initialState as optionsInitial } from '../../src/reducers/options'
import Selectors from '../../src/selectors'

import {
  selectVmDetail,
  fetchSingleVm,
} from '../../src/sagas'
import {
  selectVmDetail as selectVmDetailAction,
  getSingleVm,
} from '../../src/actions'

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

    expect(result).toEqual(fetchGenerator)
  })
})
