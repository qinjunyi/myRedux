import {
  createStore,
  combineReducers,
  applyMiddleware,
  bindActionCreators
} from './utils'
import { countReducer, msgReducer } from './reducers'
import { exceptionMiddleware, loggerMiddleware } from './middleware'

const reducers = combineReducers({ counter: countReducer, msg: msgReducer })

const overrideCreateStoreFunc = applyMiddleware(
  loggerMiddleware,
  exceptionMiddleware
)

const store = createStore(reducers, overrideCreateStoreFunc)

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
  decrement: (val) => ({ type: 'DECREMENT', payload: val }),
  modifyContent: () => ({
    type: 'MODIFY_CONTENT',
    payload: { content: 'test' }
  })
}
const actions = bindActionCreators(actionCreators, store.dispatch)
actions.decrement(2)
actions.modifyContent()
