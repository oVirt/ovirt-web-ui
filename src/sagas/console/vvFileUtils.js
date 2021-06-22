
export function adjustVVFile ({ data = '', options: { fullscreen, ctrlAltDelToEnd, smartcardEnabled, usbAutoshare, usbFilter } = {} } = {}) {
  if (fullscreen) {
    data = data.replace(/^fullscreen=0/mg, 'fullscreen=1')
  }

  const pattern = /^secure-attention=.*$/mg
  let text = 'secure-attention=ctrl+alt+del'
  if (ctrlAltDelToEnd) {
    text = 'secure-attention=ctrl+alt+end'
  }
  if (data.match(pattern)) {
    console.log('secure-attention found, replacing by ', text)
    data = data.replace(pattern, text)
  } else {
    console.log('secure-attention was not found, inserting ', text)
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\n${text}`) // ending \n is already there
  }

  if (usbFilter) {
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\nusb-filter=${usbFilter}`)
    data = data.replace(/^usb-filter=null\n/mg, '') // remove an extra 'usb-filter=null' line if present
  }

  data = data.replace(/^enable-smartcard=[01]$/mg, `enable-smartcard=${smartcardEnabled ? 1 : 0}`)

  data = data.replace(/^enable-usb-autoshare=.*$/mg, `enable-usb-autoshare=${usbAutoshare ? 1 : 0}`)

  console.log('adjustVVFile data after adjustment:', data)
  return data
}
