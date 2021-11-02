import CreateStore from './utils/CreateStore.js'

let initialState = { counter: { count: 0 }, msg: { id: 0, content: 'test' } }

const countReducer = (state, action) => {
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
const msgReducer = (state, action) => {
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
const combineReducers = (originReducers) => {
  const rKeys = Object.keys(originReducers)
  return function (state, action) {
    const nextState = {}
    for (let i = 0; i < rKeys.length; i++) {
      const key = rKeys[i]
      nextState[key] = originReducers[key](state[key], action)
    }
    return nextState
  }
}
const reducers = combineReducers({ counter: countReducer, msg: msgReducer })
const store = CreateStore(reducers, initialState)

store.subscribe(() => {
  const latestState = store.getState()
  console.log('count:', latestState.counter.count)
})
store.subscribe(() => {
  const latestState = store.getState()
  console.log(
    'msg-- ',
    `id:${latestState.msg.id} content:${latestState.msg.content}`
  )
})

store.dispatch({ type: 'INCREMENT', payload: 1 })
store.dispatch({ type: 'DECREMENT', payload: 2 })
store.dispatch({ type: 'MODIFY_ID', payload: { id: 1 } })
store.dispatch({ type: 'MODIFY_CONTENT', payload: { content: 'hello world' } })
