import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { MsgContext } from '_/intl'
import {
  Label,
} from '@patternfly/react-core'

import {
  Tooltip,
} from '_/components/tooltips'

import style from './style.css'

const NicNameWithLabels = ({ id, name, isFromTemplate }) => {
  const { msg } = useContext(MsgContext)
  return (
    <>
      <span id={`${id}-name`}>{ name }</span>
      { isFromTemplate && (
        <Tooltip id={`${id}-template-defined-badge`} tooltip={msg.templateDefined()}>
          <Label id={`${id}-from-template`} className={style['nic-label']}>
            T
          </Label>
        </Tooltip>
      )}
    </>
  )
}
NicNameWithLabels.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  isFromTemplate: PropTypes.bool,
}

export default NicNameWithLabels
