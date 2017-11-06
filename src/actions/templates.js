import {
  GET_ALL_TEMPLATES,
  REMOVE_TEMPLATE,
  GET_SINGLE_TEMPLATE,
} from '../constants/index'

export function removeMissingTemplates ({ templateIdsToPreserve }) {
  return {
    type: 'REMOVE_MISSING_TEMPLATES',
    payload: {
      templateIdsToPreserve,
    },
  }
}
export function addTemplates ({ templates }) {
  return {
    type: 'ADD_TEMPLATES',
    payload: {
      templates,
    },
  }
}

export function getAllTemplates ({ shallowFetch = false }) {
  return {
    type: GET_ALL_TEMPLATES,
    payload: {
      shallowFetch,
    },
  }
}

export function removeTemplate ({ id }) {
  return {
    type: REMOVE_TEMPLATE,
    payload: {
      id,
    },
  }
}

export function getSingleTemplate ({ id }) {
  return {
    type: GET_SINGLE_TEMPLATE,
    payload: {
      id,
    },
  }
}
