import PropTypes from 'prop-types'

export const RouterPropTypeShapes = {
  match: PropTypes.shape({ // or null
    params: PropTypes.object,
    isExact: PropTypes.bool,
    path: PropTypes.string,
    url: PropTypes.string,
  }),

  location: PropTypes.shape({
    key: PropTypes.string,
    pathname: PropTypes.string,
    search: PropTypes.string,
    hash: PropTypes.string,
    state: PropTypes.object,
  }),

  history: PropTypes.shape({
    length: PropTypes.number, // number of entries in the history stack
    location: PropTypes.object, // current location
    action: PropTypes.oneOf([ 'PUSH', 'REPLACE', 'POP' ]), // current navigation action
    push: PropTypes.func,
    replace: PropTypes.func,
    go: PropTypes.func,
    goBack: PropTypes.func,
    goForward: PropTypes.func,
  }),
}
