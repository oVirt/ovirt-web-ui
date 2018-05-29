import {call, put, take} from 'redux-saga/effects'
import sagasHelper from '../helper'
import { selectVmDetail, fetchSingleVm } from '../../src/sagas'
import { selectVmDetail as selectAction, setVmDetailToShow, getSingleVm } from '../../src/actions'

describe('Get VM detail test: ', () => {
	const it2 = sagasHelper(selectVmDetail(selectAction({ vmId: '123' })))

  it2('First we check returned data: ', (result) => {
    expect(result).toEqual(fetchSingleVm(getSingleVm({ vmId: '123' })))
  })
})
