export default function (originReducers) {
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
