export default function createStore(reducer, initialState, enhancer) {
  if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
    enhancer = initialState
    initialState = undefined
  }
  if (enhancer && typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, initialState)
  }
  let state = initialState
  let listeners = []

  const subscribe = (listener) => {
    listeners.push(listener)
    return function unsubscribe() {
      const curIndex = listeners.indexOf(listener)
      listeners.splice(curIndex, 1)
    }
  }

  const dispatch = (action) => {
    state = reducer(state, action)
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }

  const getState = () => {
    return state
  }
  const replaceReducer = (nextReducer) => {
    reducer = nextReducer
    dispatch({ type: Symbol() })
  }
  dispatch({ type: Symbol() })

  return { subscribe, dispatch, getState, replaceReducer }
}
