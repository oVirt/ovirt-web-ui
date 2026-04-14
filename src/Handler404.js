import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { MsgContext } from '_/intl'
import AppConfiguration from '_/config'
import ErrorContent from '_/components/ErrorContent'

const Handler404 = () => {
  const { msg } = useContext(MsgContext)
  const navigate = useNavigate()
  return (
    <div>
      <ErrorContent
        title={msg.troubleWithFindingPage()}
        description={msg.itemDoesntExistOrDontHavePermissions()}
        leftButton={{
          href: '#',
          onClick: () => navigate(-1),
          title: msg.goBack(),
        }}
        rightButton={{
          href: AppConfiguration.applicationURL,
          title: msg.viewAllVirtualMachines(),
        }}
      />
    </div>
  )
}

export default Handler404
