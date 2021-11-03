import { createStore, combineReducers } from './utils'
import { countReducer, msgReducer } from './reducers'

const reducers = combineReducers({ counter: countReducer, msg: msgReducer })

const store = createStore(reducers)
console.log('initialState:', store.getState())
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
