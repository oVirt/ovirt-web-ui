import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { MsgContext } from '_/intl'

import {
  Label,
} from '@patternfly/react-core'

import style from './style.css'
import { Tooltip } from '_/components/tooltips'

const DiskNameWithLabels = ({ id, name, isFromTemplate, bootable }) => {
  const { msg } = useContext(MsgContext)
  const idPrefix = `${id}-disk`
  return (
    <>
      <span id={`${idPrefix}-name`}>{ name }</span>
      { isFromTemplate && (
        <Tooltip id={`${idPrefix}-template-defined-badge`} tooltip={msg.templateDefined()}>
          <Label id={`${idPrefix}-from-template`} className={`${style['disk-label']}`}>
            T
          </Label>
        </Tooltip>
      )}
      { bootable && (
        <Label id={`${idPrefix}-bootable`} className={style['disk-label']} color="blue" >
          { msg.diskLabelBootable() }
        </Label>
      )}
    </>
  )
}
DiskNameWithLabels.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  isFromTemplate: PropTypes.bool,
  bootable: PropTypes.bool,
}

export default DiskNameWithLabels
