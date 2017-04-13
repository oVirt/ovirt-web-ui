import {call, put, take} from 'redux-saga/effects'
import sagasHelper from '../helper'
import { selectVmDetail, fetchSingleVm } from '../../src/sagas'
import { selectVmDetail as selectAction, setVmDetailToShow, getSingleVm } from '../../src/actions'

describe('Get VM detail test: ', () => {
	const it2 = sagasHelper(selectVmDetail(selectAction({ vmId: '123' })))
	it2('First we check if it set detail to show: ', (result) => {
		expect(result).toEqual(put(setVmDetailToShow({ vmId: '123' })))
	})

	it2('Then we must check returned data: ', (result) => {
		expect(result).toEqual(fetchSingleVm(getSingleVm({ vmId: '123' })))
	})
})
