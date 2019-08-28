import React from 'react'
import PropTypes from 'prop-types'
import * as branding from '_/branding'
import styles from './style.css'

const ErrorContent = ({ title, description, leftButton, rightButton }) => (
  <div>
    <div className={`container text-center ${styles['errorContentContainer']}`}>
      <img src={branding.resourcesUrls.errorImg} />
      <h1 className='bolder'>{title}</h1>
      <p className='h4' dangerouslySetInnerHTML={{ __html: description }} />
      <div>
        <a
          href={leftButton.href}
          className='btn'
          onClick={
            leftButton.onClick
              ? e => {
                e.preventDefault()
                leftButton.onClick()
              }
              : null
          }
        >
          {leftButton.title}
        </a>
        <a
          href={rightButton.href}
          className='btn-primary btn'
          onClick={
            rightButton.onClick
              ? e => {
                e.preventDefault()
                rightButton.onClick()
              }
              : null
          }
        >
          {rightButton.title}
        </a>
      </div>
    </div>
  </div>
)

const buttonType = PropTypes.shape({
  onClick: PropTypes.func,
  href: PropTypes.string,
  title: PropTypes.string.isRequired,
}).isRequired

ErrorContent.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  leftButton: buttonType,
  rightButton: buttonType,
}

export default ErrorContent
