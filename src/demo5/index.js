import { createStore, combineReducers } from './utils'
import { countReducer, msgReducer } from './reducers'
import { exceptionMiddleware, loggerMiddleware } from './middleware'

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
 * @description 记录改变前后状态以及捕获异常
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
/**
 * @tip step.2
 * @description 单独抽成函数并合并
 */
// const loggerMiddleware = (action) => {
//   console.log('preState:', store.getState())
//   next(action)
//   console.log('nextState', store.getState())
// }
// const exceptionMiddleware = (action) => {
//   try {
//     loggerMiddleware(action)
//   } catch (e) {
//     console.log('error:', e)
//   }
// }
// store.dispatch = exceptionMiddleware
/**
 * @tip step.3
 * @description 中间件之间解耦
 */
// const loggerMiddleware = (next) => (action) => {
//   console.log('preState:', store.getState())
//   next(action)
//   console.log('nextState', store.getState())
// }
// const exceptionMiddleware = (next) => (action) => {
//   try {
//     next(action)
//   } catch (e) {
//     console.log('error:', e)
//   }
// }
// store.dispatch = exceptionMiddleware(loggerMiddleware(next))
/**
 * @tip step.4
 * @description 剥离store
 */
// const loggerMiddleware = (store) => (next) => (action) => {
//   console.log('preState:', store.getState())
//   next(action)
//   console.log('nextState', store.getState())
// }
// const exceptionMiddleware = (store) => (next) => (action) => {
//   try {
//     next(action)
//   } catch (e) {
//     console.log('error:', e)
//   }
// }
const logger = loggerMiddleware(store)
const exception = exceptionMiddleware(store)
store.dispatch = exception(logger(next))

store.dispatch({ type: 'INCREMENT', payload: 1 })
