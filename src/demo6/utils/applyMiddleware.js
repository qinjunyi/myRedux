// 组合中间件核心
const compose = (middlewares) => {
  return middlewares.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  )
}

const applyMiddleware = (...middlewares) => {
  return function rewriteCreateStoreFunc(oldCreateStore) {
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
