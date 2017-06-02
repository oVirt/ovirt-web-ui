import { buildSagas as VmActionsSagas } from './components/VmActions/sagas'
import { buildSagas as VmDialogSagas } from './components/VmDialog/sagas'

/**
  SagasBuiler takes sagas workers from modules, and merge it to one array.
  The general idea of SagasBuilder to get in one place all module workers,
  and transform it to one array, for adding to root sagas, without making
  any mess.
*/
export default (sagas) => [
  ...VmActionsSagas(sagas),
  ...VmDialogSagas(sagas),
]
