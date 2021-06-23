import Api, { Transforms } from '_/ovirtapi'
import { put, takeLatest } from 'redux-saga/effects'
import { callExternalAction } from './utils'

import {
  setRoles,
} from '_/actions'

import {
  GET_ROLES,
} from '_/constants'

export function* fetchRoles (action) {
  const rolesApi = yield callExternalAction('getRoles', Api.getRoles, action)

  if (rolesApi && rolesApi.role) {
    const roles = rolesApi.role.map(role => Transforms.Role.toInternal({ role }))
    yield put(setRoles(roles))
  }
}

export default [
  takeLatest(GET_ROLES, fetchRoles),
]
