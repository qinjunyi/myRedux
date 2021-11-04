let initialState = { count: 0 }

const countReducer = (state, action) => {
  if (!state) {
    state = initialState
  }
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.payload }
      break
    case 'DECREMENT':
      return { count: state.count - action.payload }
      break
    default:
      return state
  }
}
export default countReducer
