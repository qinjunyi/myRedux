const exceptionMiddleware = (store) => (next) => (action) => {
  try {
    next(action)
  } catch (e) {
    console.log('error:', e)
  }
}

export default exceptionMiddleware
