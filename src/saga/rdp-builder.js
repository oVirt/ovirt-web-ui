
const BASE_CONFIG_FILE = 'session bpp:i:32\n' +
                          'winposstr:s:0,3,0,0,800,600\n' +
                          'compression:i:1\n' +
                          'keyboardhook:i:2\n' +
                          'audiocapturemode:i:0\n' +
                          'videoplaybackmode:i:1\n' +
                          'connection type:i:2\n' +
                          'displayconnectionbar:i:1\n' +
                          'disable wallpaper:i:1\n' +
                          'allow font smoothing:i:0\n' +
                          'allow desktop composition:i:0\n' +
                          'disable full window drag:i:1\n' +
                          'disable menu anims:i:1\n' +
                          'disable themes:i:0\n' +
                          'disable cursor setting:i:0\n' +
                          'bitmapcachepersistenable:i:1\n' +
                          'audiomode:i:0\n' +
                          'redirectcomports:i:0\n' +
                          'redirectposdevices:i:0\n' +
                          'redirectdirectx:i:1\n' +
                          'autoreconnection enabled:i:1\n' +
                          'prompt for credentials:i:1\n' +
                          'negotiate security layer:i:1\n' +
                          'remoteapplicationmode:i:0\n' +
                          'alternate shell:s:\n' +
                          'shell working directory:s:\n' +
                          'gatewayhostname:s:\n' +
                          'gatewayusagemethod:i:4\n' +
                          'gatewaycredentialssource:i:4\n' +
                          'gatewayprofileusagemethod:i:0\n' +
                          'promptcredentialonce:i:1\n' +
                          'use redirection server name:i:0'
export default class RDPBuilder {
  constructor ({ vmName, username, domain, fqdn }) {
    this.address = fqdn || vmName
    this.guestID = ''
    this.fullScreen = true
    this.width = 640
    this.height = 480
    this.authenticationLevel = 2
    this.useLocalDrives = false
    this.redirectPrinters = false
    this.redirectClipboard = true
    this.redirectSmartCards = false
    this.username = username
    this.domain = domain
  }

  getUsername () {
    const atPosition = this.username.indexOf('@')
    if (atPosition !== -1) {
      this.username = this.username.slice(0, atPosition)
    }
    return `${this.username}@${this.domain}`
  }

  getFullScreen () {
    return this.fullScreen
  }

  setFullScreen (fullScreen) {
    this.fullScreen = fullScreen
  }

  getWidth () {
    return this.width
  }

  setWidth (width) {
    this.width = width
  }

  getHeight () {
    return this.height
  }

  setHeight (height) {
    this.height = height
  }

  getAuthenticationLevel () {
    return this.authenticationLevel
  }

  setAuthenticationLevel (authenticationLevel) {
    this.authenticationLevel = authenticationLevel
  }

  getRedirectPrinters () {
    return this.redirectPrinters
  }

  setRedirectPrinters (redirectPrinters) {
    this.redirectPrinters = redirectPrinters
  }

  getRedirectClipboard () {
    return this.redirectClipboard
  }

  setRedirectClipboard (redirectClipboard) {
    this.redirectClipboard = redirectClipboard
  }

  getRedirectSmartCards () {
    return this.redirectSmartCards
  }

  setRedirectSmartCards (redirectSmartCards) {
    this.redirectSmartCards = redirectSmartCards
  }

  getAddress () {
    return this.address
  }

  setAddress (value) {
    this.address = value
  }

  getGuestID () {
    return this.guestID
  }

  setGuestID (value) {
    this.guestID = value
  }

  getUseLocalDrives () {
    return this.useLocalDrives
  }

  setUseLocalDrives (value) {
    this.useLocalDrives = value
  }

  booleanToInt (b) {
    if (b == null || b === false) {
      return 0
    }

    return 1
  }

  getScreenMode () {
    if (this.getFullScreen()) {
      return 2
    }

    return 1
  }

  getredirectDrivesLines () {
    if (this.getUseLocalDrives()) {
      return '\ndrivestoredirect:s:*'
    } else {
      return '\ndrivestoredirect:s:'
    }
  }

  getEnableCredSspSupport () {
    return true
  }

  buildRDP () {
    let result = BASE_CONFIG_FILE
    result += `\nscreen mode id:i:${this.getScreenMode()}` +
              `\ndesktopwidth:i:${this.getWidth()}` +
              `\ndesktopheight:i:${this.getHeight()}` +
              `\nauthentication level:i:${this.getAuthenticationLevel()}` +
              `\nfull address:s:${this.getAddress()}` +
              `\nenablecredsspsupport:i:${this.booleanToInt(this.getEnableCredSspSupport())}` +
              `${this.getredirectDrivesLines()}` +
              `\nredirectprinters:i:${this.booleanToInt(this.getRedirectPrinters())}` +
              `\nredirectsmartcards:i:${this.booleanToInt(this.getRedirectSmartCards())}` +
              `\nredirectclipboard:i:${this.booleanToInt(this.getRedirectClipboard())}` +
              `\nusername:s:${this.getUsername()}`
    return result
  }
}
