import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { goBack } from 'connected-react-router'
import { MsgContext } from '_/intl'
import AppConfiguration from '_/config'
import ErrorContent from '_/components/ErrorContent'

const Handler404 = ({ goBack }) => {
  const { msg } = useContext(MsgContext)
  return (
    <div>
      <ErrorContent
        title={msg.troubleWithFindingPage()}
        description={msg.itemDoesntExistOrDontHavePermissions()}
        leftButton={{
          href: '#',
          onClick: goBack,
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

Handler404.propTypes = {
  goBack: PropTypes.func.isRequired,
}

export default connect(
  null,
  (dispatch) => ({
    goBack: () => dispatch(goBack()),
  })
)(Handler404)
