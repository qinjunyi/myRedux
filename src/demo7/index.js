import {
  createStore,
  combineReducers,
  applyMiddleware,
  bindActionCreators
} from './utils'
import { countReducer, msgReducer } from './reducers'
import { exceptionMiddleware, loggerMiddleware } from './middleware'

const reducers = combineReducers({ counter: countReducer, msg: msgReducer })

const rewriteCreateStoreFunc = applyMiddleware(
  loggerMiddleware,
  exceptionMiddleware
)

const store = createStore(reducers, rewriteCreateStoreFunc)

store.subscribe(() => {
  const latestState = store.getState()
  console.log('count:', latestState.counter.count)
  console.log(
    'msg-- ',
    `id:${latestState.msg.id} content:${latestState.msg.content}`
  )
})

store.dispatch({ type: 'INCREMENT', payload: 1 })

const actionCreators = {
  decrement: () => ({ type: 'DECREMENT', payload: 2 }),
  modifyContent: () => ({
    type: 'MODIFY_CONTENT',
    payload: { content: 'test' }
  })
}
const actions = bindActionCreators(actionCreators, store.dispatch)
actions.decrement()
actions.modifyContent()
