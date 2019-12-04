import {
  GET_ALL_TEMPLATES,
  SET_TEMPLATES,
  TEMPLATE_GET_DISKS,
  TEMPLATE_GET_NICS,
  TEMPLATE_SET_DISKS,
  TEMPLATE_SET_NICS,
} from '_/constants'

export function getTemplateDisks (templateId) {
  return {
    type: TEMPLATE_GET_DISKS,
    payload: {
      templateId,
    },
  }
}

export function getTemplateNics (templateId) {
  return {
    type: TEMPLATE_GET_NICS,
    payload: {
      templateId,
    },
  }
}

export function getAllTemplates () {
  return { type: GET_ALL_TEMPLATES }
}

export function setTemplateDisks (templateId, disks) {
  return {
    type: TEMPLATE_SET_DISKS,
    payload: {
      templateId,
      disks,
    },
  }
}

export function setTemplateNics (templateId, nics) {
  return {
    type: TEMPLATE_SET_NICS,
    payload: {
      templateId,
      nics,
    },
  }
}

export function setTemplates (templates) {
  return {
    type: SET_TEMPLATES,
    payload: {
      templates,
    },
  }
}
