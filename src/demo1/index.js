let state = { count: 0, info: { name: 'person' } }

const createStore = (initialState) => {
  let state = initialState
  let listeners = []

  const subscribe = (listener) => {
    listeners.push(listener)
  }

  const changeState = (curState) => {
    state = curState
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }
  const getState = () => {
    return state
  }
  return { subscribe, changeState, getState }
}

const store = createStore(state)

store.subscribe(() => {
  console.log(
    'count:',
    store.getState().count,
    'name:',
    store.getState().info.name
  )
})

store.changeState({ ...store.getState(), info: { name: '小李' } })
store.changeState({ ...store.getState(), count: 1 })
