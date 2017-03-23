import React, { PropTypes } from 'react'

import style from './style.css'

const VmStatusText = ({ vm }) => {
  const lastMessage = vm.get('lastMessage')
  const status = vm.get('status')

  const croppedInfoClass = 'card-pf-info text-center ' + style.crop

  if (lastMessage) {
    return (
      <p className={croppedInfoClass} title={lastMessage} data-toggle='tooltip'>
        <span className='pficon-warning-triangle-o' />&nbsp;{lastMessage}
      </p>
    )
  }

  switch (status) { // TODO: review VM states
    case 'up':
    case 'powering_up':
    case 'paused':
    case 'migrating':
    default:
      const description = vm.get('description')
      return (
        <p className={croppedInfoClass} title={description} data-toggle='tooltip'>
          &nbsp;{description}
        </p>
      )
  }
}
VmStatusText.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default VmStatusText
