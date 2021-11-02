export default function (reducer, initialState) {
  let state = initialState
  let listeners = []

  const subscribe = (listener) => {
    listeners.push(listener)
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
  return { subscribe, dispatch, getState }
}
