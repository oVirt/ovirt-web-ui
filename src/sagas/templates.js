import Api from '_/ovirtapi'
import { all, put, takeLatest } from 'redux-saga/effects'
import { callExternalAction, fetchPermits, PermissionsType } from './utils'

import {
  setTemplateDisks,
  setTemplateNics,
  setTemplates,
} from '_/actions'

import {
  TEMPLATE_GET_DISKS,
  TEMPLATE_GET_NICS,
  GET_ALL_TEMPLATES,
} from '_/constants'

import { canUserUseTemplate } from '_/utils'

export function* fetchAllTemplates (action) {
  const templates = yield callExternalAction('getAllTemplates', Api.getAllTemplates, action)

  if (templates && templates['template']) {
    const templatesInternal = (yield all(
      templates.template
        .map(function* (template) {
          const templateInternal = Api.templateToInternal({ template })
          templateInternal.permits = yield fetchPermits({ entityType: PermissionsType.TEMPLATE_TYPE, id: template.id })
          templateInternal.canUserUseTemplate = canUserUseTemplate(templateInternal.permits)
          return templateInternal
        })
    ))

    yield put(setTemplates(templatesInternal))
  }
}

function* fetchTemplateDisks (action) {
  const disks = yield callExternalAction('getTemplateDiskAttachments', Api.getTemplateDiskAttachments, action)

  if (disks && disks['disk_attachment']) {
    const disksInternal = disks.disk_attachment.map(
      attachment => Api.diskToInternal({ attachment, disk: attachment.disk })
    )
    yield put(setTemplateDisks(disksInternal))
  }
}

function* fetchTemplateNics (action) {
  const nics = yield callExternalAction('getTemplateNics', Api.getTemplateNics, action)

  if (nics && nics['nic']) {
    const nicsInternal = nics.nic.map(
      nic => Api.nicToInternal({ nic })
    )
    yield put(setTemplateNics(nicsInternal))
  }
}

export default [
  takeLatest(GET_ALL_TEMPLATES, fetchAllTemplates),
  takeLatest(TEMPLATE_GET_DISKS, fetchTemplateDisks),
  takeLatest(TEMPLATE_GET_NICS, fetchTemplateNics),
]
