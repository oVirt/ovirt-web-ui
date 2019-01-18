// Keep alphabetically sorted
// TODO: remove all constants except those used within sagas
export const ADD_ACTIVE_REQUEST = 'ADD_ACTIVE_REQUEST'
export const ADD_DISK_REMOVAL_PENDING_TASK = 'ADD_DISK_REMOVAL_PENDING_TASK'
export const ADD_NETWORKS_TO_VNIC_PROFILES = 'ADD_NETWORKS_TO_VNIC_PROFILES'
export const ADD_SNAPSHOT_ADD_PENDING_TASK = 'ADD_SNAPSHOT_ADD_PENDING_TASK'
export const ADD_SNAPSHOT_REMOVAL_PENDING_TASK = 'ADD_SNAPSHOT_REMOVAL_PENDING_TASK'
export const ADD_SNAPSHOT_RESTORE_PENDING_TASK = 'ADD_SNAPSHOT_RESTORE_PENDING_TASK'
export const ADD_VM_NIC = 'ADD_VM_NIC'
export const ADD_USER_MESSAGE = 'ADD_USER_MESSAGE'
export const CHANGE_PAGE = 'CHANGE_PAGE'
export const CHANGE_VM_CDROM = 'CHANGE_VM_CDROM'
export const CHECK_CONSOLE_IN_USE = 'CHECK_CONSOLE_IN_USE'
export const CHECK_TOKEN_EXPIRED = 'CHECK_TOKEN_EXPIRED'
export const CLEAR_USER_MSGS = 'CLEAR_USER_MSGS'
export const CREATE_DISK_FOR_VM = 'CREATE_DISK_FOR_VM'
export const CREATE_VM = 'CREATE_VM'
export const DELAYED_REMOVE_ACTIVE_REQUEST = 'DELAYED_REMOVE_ACTIVE_REQUEST'
export const DELETE_VM_NIC = 'DELETE_VM_NIC'
export const DISMISS_USER_MSG = 'DISMISS_USER_MSG'
export const DOWNLOAD_CONSOLE_VM = 'DOWNLOAD_CONSOLE_VM'
export const EDIT_VM = 'EDIT_VM'
export const EDIT_VM_DISK = 'EDIT_VM_DISK'
export const EDIT_VM_NIC = 'EDIT_VM_NIC'
export const FAILED_EXTERNAL_ACTION = 'FAILED_EXTERNAL_ACTION'
export const GET_ALL_CLUSTERS = 'GET_ALL_CLUSTERS'
export const GET_ALL_HOSTS = 'GET_ALL_HOSTS'
export const GET_ALL_OS = 'GET_ALL_OS'
export const GET_ALL_STORAGE_DOMAINS = 'GET_ALL_STORAGE_DOMAINS'
export const GET_ALL_TEMPLATES = 'GET_ALL_TEMPLATES'
export const GET_ALL_VNIC_PROFILES = 'GET_ALL_VNIC_PROFILES'
export const GET_BY_PAGE = 'GET_BY_PAGE'
export const GET_CONSOLE_OPTIONS = 'GET_CONSOLE_OPTIONS'
export const GET_ISO_FILES = 'GET_ISO_FILES'
export const GET_OPTION = 'GET_OPTION'
export const GET_POOL = 'GET_POOL'
export const GET_POOLS_BY_COUNT = 'GET_POOLS_BY_COUNT'
export const GET_POOLS_BY_PAGE = 'GET_POOLS_BY_PAGE'
export const GET_RDP_VM = 'GET_RDP_VM'
export const GET_USB_FILTER = 'GET_USB_FILTER'
export const GET_USER_GROUPS = 'GET_USER_GROUPS'
export const GET_VM = 'GET_VM'
export const GET_VM_CDROM = 'GET_VM_CDROM'
export const GET_VMS_BY_COUNT = 'GET_VMS_BY_COUNT'
export const GET_VMS_BY_PAGE = 'GET_VMS_BY_PAGE'
export const LOGIN = 'LOGIN'
export const LOGIN_FAILED = 'LOGIN_FAILED'
export const LOGIN_SUCCESSFUL = 'LOGIN_SUCCESSFUL'
export const LOGOUT = 'LOGOUT'
export const MAX_VM_MEMORY_FACTOR = 4 // see Edit VM flow; magic constant to stay aligned with Web Admin
export const OPEN_CONSOLE_VM = 'OPEN_CONSOLE_VM'
export const PERSIST_STATE = 'PERSIST_STATE'
export const POOL_ACTION_IN_PROGRESS = 'POOL_ACTION_IN_PROGRESS'
export const REDIRECT = 'REDIRECT'
export const REFRESH_DATA = 'REFRESH_DATA'
export const REMOVE_ACTIVE_REQUEST = 'REMOVE_ACTIVE_REQUEST'
export const REMOVE_DISK = 'REMOVE_DISK'
export const REMOVE_DISK_REMOVAL_PENDING_TASK = 'REMOVE_DISK_REMOVAL_PENDING_TASK'
export const REMOVE_MISSING_POOLS = 'REMOVE_MISSING_POOLS'
export const REMOVE_MISSING_VMS = 'REMOVE_MISSING_VMS'
export const REMOVE_POOL = 'REMOVE_POOL'
export const REMOVE_POOLS = 'REMOVE_POOLS'
export const REMOVE_SNAPSHOT_ADD_PENDING_TASK = 'REMOVE_SNAPSHOT_ADD_PENDING_TASK'
export const REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK = 'REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK'
export const REMOVE_SNAPSHOT_RESTORE_PENDING_TASK = 'REMOVE_SNAPSHOT_RESTORE_PENDING_TASK'
export const REMOVE_VM = 'REMOVE_VM'
export const REMOVE_VMS = 'REMOVE_VMS'
export const RESTART_VM = 'RESTART_VM'
export const SAVE_CONSOLE_OPTIONS = 'SAVE_CONSOLE_OPTIONS'
export const SELECT_POOL_DETAIL = 'SELECT_POOL_DETAIL'
export const SELECT_VM_DETAIL = 'SELECT_VM_DETAIL'
export const SET_ADMINISTRATOR = 'SET_ADMINISTRATOR'
export const SET_CHANGED = 'SET_CHANGED'
export const SET_CLUSTERS = 'SET_CLUSTERS'
export const SET_ACTIVE_CONSOLE = 'SET_ACTIVE_CONSOLE'
export const SET_CONSOLE_IN_USE = 'SET_CONSOLE_IN_USE'
export const SET_CONSOLE_LOGON = 'SET_CONSOLE_LOGON'
export const SET_CONSOLE_OPTIONS = 'SET_CONSOLE_OPTIONS'
export const SET_CONSOLE_TICKETS = 'SET_CONSOLE_TICKETS'
export const SET_CONSOLE_VALID = 'SET_CONSOLE_VALID'
export const SET_CURRENT_PAGE = 'SET_CURRENT_PAGE'
export const SET_DATA_CENTERS = 'SET_DATA_CENTERS'
export const SET_DOMAIN = 'SET_DOMAIN'
export const SET_HOSTS = 'SET_HOSTS'
export const SET_OPERATING_SYSTEMS = 'SET_OPERATING_SYSTEMS'
export const SET_OVIRT_API_VERSION = 'SET_OVIRT_API_VERSION'
export const SET_PAGE = 'SET_PAGE'
export const SET_STORAGE_DOMAIN_FILES = 'SET_STORAGE_DOMAIN_FILES'
export const SET_STORAGE_DOMAINS = 'SET_STORAGE_DOMAINS'
export const SET_TEMPLATES = 'SET_TEMPLATES'
export const SET_USB_FILTER = 'SET_USB_FILTER'
export const SET_USER_FILTER_PERMISSION = 'SET_USER_FILTER_PERMISSION'
export const SET_USER_GROUPS = 'SET_USER_GROUPS'
export const SET_USERMSG_NOTIFIED = 'SET_USERMSG_NOTIFIED'
export const SET_VM_ACTION_RESULT = 'SET_VM_ACTION_RESULT'
export const SET_VM_CDROM = 'SET_VM_CDROM'
export const SET_VM_CONSOLES = 'SET_VM_CONSOLES'
export const SET_VM_DISKS = 'SET_VM_DISKS'
export const SET_VM_NICS = 'SET_VM_NICS'
export const SET_VM_SESSIONS = 'SET_VM_SESSIONS'
export const SET_VNIC_PROFILES = 'SET_VNIC_PROFILES'
export const SET_VM_SNAPSHOTS = 'SET_VM_SNAPSHOTS'
export const SHOW_TOKEN_EXPIRED_MSG = 'SHOW_TOKEN_EXPIRED_MSG'
export const SHUTDOWN_VM = 'SHUTDOWN_VM'
export const START_POOL = 'START_POOL'
export const START_SCHEDULER_FIXED_DELAY = 'START_SCHEDULER_FIXED_DELAY'
export const START_VM = 'START_VM'
export const STOP_SCHEDULER_FIXED_DELAY = 'STOP_SCHEDULER_FIXED_DELAY'
export const SUSPEND_VM = 'SUSPEND_VM'
export const UPDATE_ICONS = 'UPDATE_ICONS'
export const UPDATE_POOLS = 'UPDATE_POOLS'
export const UPDATE_VM_SNAPSHOT = 'UPDATE_VM_SNAPSHOT'
export const UPDATE_VMPOOLS_COUNT = 'UPDATE_VMPOOLS_COUNT'
export const UPDATE_VM_DISK = 'UPDATE_VM_DISK'
export const UPDATE_VMS = 'UPDATE_VMS'
export const VM_ACTION_IN_PROGRESS = 'VM_ACTION_IN_PROGRESS'

export * from './pages'
