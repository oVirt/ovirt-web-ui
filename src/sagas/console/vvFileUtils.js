
export function adjustVVFile ({ data, options, usbAutoshare, usbFilter }) {
  // __options__ can either be a plain JS object or ImmutableJS Map
  console.log('adjustVVFile options:', options)

  if (options && ((options.get && options.get('fullscreen')) || options.fullscreen)) {
    data = data.replace(/^fullscreen=0/mg, 'fullscreen=1')
  }

  const pattern = /^secure-attention=.*$/mg
  let text = 'secure-attention=ctrl+alt+del'
  if (options && ((options.get && options.get('ctrlAltDelToEnd')) || options.ctrlAltDelToEnd)) {
    text = 'secure-attention=ctrl+alt+end'
  }
  if (data.match(pattern)) {
    console.log('secure-attention found, replacing by ', text)
    data = data.replace(pattern, text)
  } else {
    console.log('secure-attention was not found, inserting ', text)
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\n${text}`) // ending \n is already there
  }

  const isSpice = data.indexOf('type=spice') > -1

  if (usbFilter && isSpice) {
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\nusb-filter=${usbFilter}`)
    data = data.replace(/^usb-filter=null\n/mg, '') // remove an extra 'usb-filter=null' line if present
  }

  if (options && isSpice) {
    const smartcardEnabled = options.get ? options.get('smartcardEnabled') : options.smartcardEnabled
    data = data.replace(/^enable-smartcard=[01]$/mg, `enable-smartcard=${smartcardEnabled ? 1 : 0}`)
  }

  // make USB Auto-Share to be enabled/disabled in VM Portal according to the SpiceUsbAutoShare config value
  data = data.replace(/^enable-usb-autoshare=.*$/mg, `enable-usb-autoshare=${usbAutoshare ? 1 : 0}`)

  console.log('adjustVVFile data after adjustment:', data)
  return data
}
