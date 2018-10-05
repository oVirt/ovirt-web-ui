import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'patternfly-react'

const SECTION_OPENED_ICON = {
  false: {
    type: 'fa',
    name: 'angle-right',
  },
  true: {
    type: 'fa',
    name: 'angle-down',
  },
}

/*
 * React implementation of https://www.patternfly.org/pattern-library/forms-and-controls/expand-collapse-section/
 */
class ExpandCollapseSection extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      opened: props.opened,
    }

    this.handleToggleExpand = this.handleToggleExpand.bind(this)
  }

  handleToggleExpand (e) {
    e.preventDefault()
    this.setState(state => ({ opened: !state.opened }))
  }

  render () {
    const { id, sectionHeader, children } = this.props
    const { opened } = this.state

    return (
      <fieldset id={id} className='fields-section-pf'>
        <legend className='fields-section-header-pf' aria-expanded={opened ? 'true' : 'false'}>
          <Icon {...SECTION_OPENED_ICON[opened]} className='field-section-toggle-pf-icon' />
          <a href='#' className='field-section-toggle-pf' onClick={this.handleToggleExpand}>
            {sectionHeader}
          </a>
        </legend>
        <div className={opened ? '' : 'hidden'}>
          {children}
        </div>
      </fieldset>
    )
  }
}
ExpandCollapseSection.propTypes = {
  id: PropTypes.string.isRequired,
  opened: PropTypes.bool,
  sectionHeader: PropTypes.string,
  children: PropTypes.node.isRequired,
}
ExpandCollapseSection.defaultProps = {
  opened: false,
  sectionHeader: 'Advanced Options',
}

export default ExpandCollapseSection
