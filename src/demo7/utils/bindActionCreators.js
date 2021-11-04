const bindActionCreator = (actionCreator, dispatch) => {
  return function () {
    return dispatch(actionCreator.apply(this, arguments))
  }
}
const bindActionCreators = (actionCreators, dispatch) => {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error()
  }
  const boundActionCreator = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreator[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreator
}
export default bindActionCreators
