import { createStore, combineReducers } from './utils'
import { countReducer, msgReducer } from './reducers'

const reducers = combineReducers({ counter: countReducer, msg: msgReducer })

const store = createStore(reducers)
const next = store.dispatch

store.subscribe(() => {
  const latestState = store.getState()
  console.log('count:', latestState.counter.count)
  console.log(
    'msg-- ',
    `id:${latestState.msg.id} content:${latestState.msg.content}`
  )
})
/**
 * @tip step.1
 * @description 记录改变前后状态以及
 */
// store.dispatch = (action) => {
//   console.log('preState:', store.getState())
//   next(action)
//   console.log('nextState', store.getState())
// }
// store.dispatch = (action) => {
//   try {
//     console.log('preState:', store.getState())
//     next(action)
//     console.log('nextState', store.getState())
//   } catch (e) {
//     console.log('error:', e)
//   }
// }
store.dispatch({ type: 'INCREMENT', payload: 1 })
