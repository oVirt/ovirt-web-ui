import { all, call, put, select } from 'redux-saga/effects'
import { loadFromLocalStorage, saveToLocalStorage } from '_/storage'
import { updateIcons } from '_/actions'
import Api from '_/ovirtapi'

import { callExternalAction } from './utils'

export function* loadIconsFromLocalStorage () {
  const iconMapString = loadFromLocalStorage('icons')
  try {
    const iconMap = iconMapString && JSON.parse(iconMapString)
    if (iconMap) {
      const iconArray = Object.values(iconMap)
      console.log(`Loaded ${iconArray.length} cached icons from localStorage`)
      yield put(updateIcons({ icons: iconArray }))
    }
  } catch (e) {
    console.error('Unexpected value of `icons` in localStorage', e)
  }
}

function* pushIconsToLocalStorage () {
  const iconMap = yield select(state => state.icons) // ImmutableJS Map
  const iconsString = JSON.stringify(iconMap)
  saveToLocalStorage('icons', iconsString)
}

export function* fetchUnknownIcons ({ vms = [], os = [] }) {
  // unique iconIds from all VMs or OS
  const iconsIds = new Set()
  vms.forEach(vm => iconsIds.add(vm.icons.large.id))
  os.forEach(os => iconsIds.add(os.icons.large.id))

  // reduce to just unknown
  const allKnownIcons = yield select(state => state.icons)
  const notLoadedIconIds = [...iconsIds].filter(id => id && !allKnownIcons.has(id))

  if (notLoadedIconIds.length > 0) {
    console.log(`Fetching ${notLoadedIconIds.length} OS icons:`, notLoadedIconIds)
    yield all(notLoadedIconIds.map(iconId => call(fetchIcon, { iconId })))
    yield pushIconsToLocalStorage()
  }
}

function* fetchIcon ({ iconId }) {
  if (!iconId) {
    return
  }

  const icon = yield callExternalAction('icon', Api.icon, { payload: { id: iconId } })
  if (icon['media_type'] && icon['data']) {
    yield put(updateIcons({ icons: [Api.iconToInternal({ icon })] }))
  }
}
