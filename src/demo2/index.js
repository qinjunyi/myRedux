let initialState = { count: 0 }

const createStore = (format, initialState) => {
  let state = initialState
  let listeners = []

  const subscribe = (listener) => {
    listeners.push(listener)
  }

  const changeState = (action) => {
    state = format(state, action)
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }
  const getState = () => {
    return state
  }
  return { subscribe, changeState, getState }
}

const format = (state, action) => {
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

const store = createStore(format, initialState)

store.subscribe(() => {
  const latestState = store.getState()
  console.log('count:', latestState.count)
})

store.changeState({ type: 'INCREMENT', payload: 1 })
store.changeState({ type: 'DECREMENT', payload: 2 })
