import React from 'react'

import ReactDOM from 'react-dom'

export default ({ Component, onYes, onNo, props }) => {
  const containerId = 'extrnal-modal-container'
  const container = document.getElementById(containerId)
  const wrapper = document.body.appendChild(container || document.createElement('div'))
  wrapper.id = containerId
  wrapper.className = 'confirmation-container'

  function dispose () {
    setTimeout(() => {
      ReactDOM.unmountComponentAtNode(wrapper)
      setTimeout(() => wrapper.remove(), 0)
    }, 1)
  }

  const onYesWrap = (params) => {
    dispose()
    onYes(params)
  }

  const onNoWrap = (params) => {
    dispose()
    onNo(params)
  }

  try {
    ReactDOM.render(
      <Component
        onYes={onYesWrap}
        onNo={onNoWrap}
        {...props}
      />,
      wrapper
    )
  } catch (e) {
    console.error(e)
    throw e
  }
}
