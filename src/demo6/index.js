import { createStore, combineReducers, applyMiddleware } from './utils'
import { countReducer, msgReducer } from './reducers'
import { exceptionMiddleware, loggerMiddleware } from './middleware'

const reducers = combineReducers({ counter: countReducer, msg: msgReducer })

const newCreateStore = applyMiddleware(
  loggerMiddleware,
  exceptionMiddleware
)(createStore)

const store = newCreateStore(reducers)

store.subscribe(() => {
  const latestState = store.getState()
  console.log('count:', latestState.counter.count)
  console.log(
    'msg-- ',
    `id:${latestState.msg.id} content:${latestState.msg.content}`
  )
})

store.dispatch({ type: 'INCREMENT', payload: 1 })
