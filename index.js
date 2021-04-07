/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2021-03-26 15:15:34
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-03-30 10:06:05
 */
const createStore = function (initialState) {
  let state = initialState
  let listeners = []

  function subscribe(listener) {
    listeners.push(listener)
  }

  function changeState(newState) {
    state = newState
    listeners.forEach((lser) => {
      lser()
    })
  }

  function getState() {
    return state
  }
  return {
    subscribe,
    changeState,
    getState
  }
}
function plan(state = {}, action) {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + 1
      }
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - 1
      }
    default:
      return state
  }
}
