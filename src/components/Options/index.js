import React from 'react'
import { connect } from 'react-redux'

import DetailContainer from '../DetailContainer'

const Options = () => {
  return (
    <DetailContainer>
      Options
    </DetailContainer>
  )
}
Options.propTypes = {
}

export default connect()(Options)
