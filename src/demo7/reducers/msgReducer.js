let initialState = { id: 0, content: '' }

const msgReducer = (state, action) => {
  if (!state) {
    state = initialState
  }
  switch (action.type) {
    case 'MODIFY_ID':
      return { ...state, id: action.payload.id }
      break
    case 'MODIFY_CONTENT':
      return { ...state, content: action.payload.content }
      break
    default:
      return state
  }
}
export default msgReducer
