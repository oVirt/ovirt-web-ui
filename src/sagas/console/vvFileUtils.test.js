import { adjustVVFile } from './vvFileUtils'

describe('test error handling', function () {
  it('should return empty string when no data', function () {
    expect(adjustVVFile()).toEqual('')
  })
  it('should add secure attention when missing', function() {
    const data = '[virt-viewer]\ntype=vnc\n'
    expect(adjustVVFile({data})).toEqual('[virt-viewer]\nsecure-attention=ctrl+alt+del\ntype=vnc\n')
  })
})

describe('test flags one-by-one', function () {
  it('should set fullscreen', function () {
    const data = '[virt-viewer]\nfullscreen=0\nsecure-attention=ctrl+alt+del\n'
    const options = {fullscreen: true}
    expect(adjustVVFile({data, options},)).toEqual('[virt-viewer]\nfullscreen=1\nsecure-attention=ctrl+alt+del\n')
  })

  it('should set secure-attention', function () {
    const data = '[virt-viewer]\nsecure-attention=ctrl+alt+del\n'
    const options = {ctrlAltDelToEnd: true}
    expect(adjustVVFile({data, options},)).toEqual('[virt-viewer]\nsecure-attention=ctrl+alt+end\n')
  })

  it('should set usb filter', function () {
    const data = '[virt-viewer]\nusb-filter=null\nsecure-attention=ctrl+alt+del\n'
    const options = {usbFilter: '1,1,1,1'}
    expect(adjustVVFile({data, options},)).toEqual('[virt-viewer]\nusb-filter=1,1,1,1\nsecure-attention=ctrl+alt+del\n')
  })

  it('should set enable-smartcard', function () {
    const data = '[virt-viewer]\nenable-smartcard=0\nsecure-attention=ctrl+alt+del\n'
    const options = {smartcardEnabled: true}
    expect(adjustVVFile({data, options},)).toEqual('[virt-viewer]\nenable-smartcard=1\nsecure-attention=ctrl+alt+del\n')
  })

  it('should set enable-usb-autoshare', function () {
    const data = '[virt-viewer]\nenable-usb-autoshare=0\nsecure-attention=ctrl+alt+del\n'
    const options = {usbAutoshare: true}
    expect(adjustVVFile({data, options},)).toEqual('[virt-viewer]\nenable-usb-autoshare=1\nsecure-attention=ctrl+alt+del\n')
  })
})