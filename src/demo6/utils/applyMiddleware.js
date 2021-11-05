// 组合中间件核心
const compose = (middlewares) => {
  return middlewares.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  )
}
// 降级方案
// const compose = (middlewares,dispatch) => {
//   let dispatchTmp = dispatch
//   middlewares.reverse().map(middleware => {
//     dispatchTmp = middleware(dispatchTmp)
//   })
//   return dispatchTmp
// }

const applyMiddleware = (...middlewares) => {
  return function overrideCreateStoreFunc(oldCreateStore) {
    return function newCreateStore(reducers, initialState) {
      const store = oldCreateStore(reducers, initialState)
      const dispatch = store.dispatch
      const injectStoreMiddlewares = middlewares.map((middleware) =>
        middleware(store)
      )
      const combineMiddlewares = compose(injectStoreMiddlewares)
      store.dispatch = combineMiddlewares(dispatch)
      return store
    }
  }
}

export default applyMiddleware
