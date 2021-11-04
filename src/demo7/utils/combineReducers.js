export default function (originReducers) {
  const rKeys = Object.keys(originReducers)
  return function (state, action) {
    const nextState = {}
    for (let i = 0; i < rKeys.length; i++) {
      const key = rKeys[i]
      const preState = state ? state[key] : undefined
      nextState[key] = originReducers[key](preState, action)
    }
    return nextState
  }
}
