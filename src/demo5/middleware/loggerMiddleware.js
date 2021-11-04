const loggerMiddleware = (store) => (next) => (action) => {
  console.log('preState:', store.getState())
  next(action)
  console.log('nextState', store.getState())
}
export default loggerMiddleware
