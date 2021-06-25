import React from 'react'
import PropTypes from 'prop-types'

import style from './sharedStyle.css'

export const SIZES = {
  SMALL: 'SMALL',
  LARGE: 'LARGE',
}

const Loader = ({ loaderText, size }) => {
  let wh = 0
  switch (size) {
    case SIZES.SMALL:
      wh = 30
      break
    case SIZES.LARGE:
      wh = 100
      break
  }
  return (
    <div className={style.loaderBox}>
      <div style={{ height: wh, width: wh }} className={style.loader} />
      <div>{loaderText}</div>
    </div>
  )
}

Loader.propTypes = {
  loaderText: PropTypes.string,
  size: PropTypes.oneOf(Object.values(SIZES)),
}

export default Loader
