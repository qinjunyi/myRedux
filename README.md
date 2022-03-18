# MyRedux

## 前言

"Redux 是 JavaScript 状态容器，提供可预测化的状态管理",这是redux官网上的简介，基于此研究下redux内部到底是如何管理js状态的，并且实现一个简易版的Redux。

## 初版

既然是个状态容器，就命名为store（为啥不叫container？因为官方叫store），再声明个类似构造函数的createStore。管理状态，很容易就想到这个store需要一个setter，一个getter，另外状态可预测，那么应该有个watcher。

```js
const createStore = (initialState) => {
  let state = initialState
  let listeners = []

  const subscribe = (listener) => {
    listeners.push(listener)
  }

  const changeState = (curState) => {
    state = curState
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }
  const getState = () => {
    return state
  }
  return { subscribe, changeState, getState }
}
```

不难就写出上面这个createStore，state存储各种状态，changeState对应setter，getState对应getter，再利用发布订阅实现状态变更时触发所有listener。

使用的话也很简单，如下：

```js
let state = { count: 0, info: { name: 'person' } }

const store = createStore(state)

store.subscribe(() => {
  console.log(
    'count:',
    store.getState().count,
    'name:',
    store.getState().info.name
  )
})

store.changeState({ ...store.getState(), info: { name: '小李' } })
store.changeState({ ...store.getState(), count: 1 })
```

一个极简单的状态管理器就ok了，完整代码可见[demo1](https://github.com/qinjunyi/myRedux/tree/master/src/demo1)

## 计划性变更

初版中，changeState其实是开放度极高的，每次修改state时，可以任意变换state中各个状态即各个属性的数据类型、值等等，因此要有限制，降低这个开放度，让state有计划的变更。就用switch/case来声明这种计划性任务。以实现count的增减操作为例：

### 规避直接变更state

将changeState中直接修改state的操作，替换成计划性变更state，这个变更暂时声明为format，作为createStore的形参。format的形参包含了当前的state以及当前的变更计划action。

```js
const createStore = (format, initialState) => {
  let state = initialState
  let listeners = []

  const subscribe = (listener) => {
    listeners.push(listener)
  }

  const changeState = (action) => {
    state = format(state, action) // 使用format()代替直接修改state,通过协商好的action限制变更操作
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }
  const getState = () => {
    return state
  }
  return { subscribe, changeState, getState }
}
```

### 定义计划

初始计划是实现count的增减，action描述了每次的变更计划，type为计划名，payload为本次变更的相关参数，返回的是变更后的state

```js
const format = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.payload }
      break
    case 'DECREMENT':
      return { count: state.count - action.payload }
      break
    default:
      return state
  }
}
```

### 使用

```js
let initialState = { count: 0}

const store = createStore(format, initialState)

store.subscribe(() => {
  const latestState = store.getState()
  console.log('count:', latestState.count)
})

store.changeState({ type: 'INCREMENT', payload: 1 })
store.changeState({ type: 'DECREMENT', payload: 2 })
store.changeState({ type: 'ANYTHING_ELSE', payload: 666 }) // 无效计划
```

这样提前定义好每次状态变更的计划，就让状态变更可控可预测，如计划之外的ANYTHING_ELSE则是无效的，返回的是原state。将变更计划的format换个名字，叫reducer吧，：）,完整代码可见[demo2](https://github.com/qinjunyi/myRedux/tree/master/src/demo2)

##  多个reducer协作

reducer的任务可见就是处理上一状态的state并返回变更后的state，但如果认知上不同功能类型的计划都放在一个reducer中，是既不美观也不易维护的，老司机们此时可能都想到了，将不同功能的reducer抽离出来，做成单独的reducer，并且要有个类似于命名空间的字段或者属性来和state进行对应，方便后续一类变更维护一类state。

增加一类变更，声明为msgReducer

```js
const countReducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.payload }
      break
    case 'DECREMENT':
      return { count: state.count - action.payload }
      break
    default:
      return state
  }
}

const msgReducer = (state, action) => {
  switch (action.type) {
    case 'MODIFY_ID':
      return { ...state, id: action.payload.id }
      break
    case 'MODIFY_CONTENT':
      return { ...state, content: action.payload.content }
      break
    default:
      return state
  }
}
```

初始state多维护个状态msg，且将两类状态用“命名空间”分隔开

```js
let initialState = { counter: { count: 0 }, msg: { id: 0, content: 'test' } }
```

createStore只是换了形参名

```js
const createStore =  (reducer, initialState) => {
 ...
  const dispatch = (action) => {
    state = reducer(state, action) // format->reducer
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }
 ...
}
```

此时要做的就是怎么将多个reducer合并得到一个rootReducer（demo中声明为reducers），来统一区分action，进行计划变更。合并reducer的函数声明为combineReducers，期望返回的也是个reducer。

```js
// 也用”命名空间“将reducer分隔开，要和state对应起来
const reducers = combineReducers({ counter: countReducer, msg: msgReducer })

const combineReducers=(originReducers) => {
  //返回的也是reducer，以供createStore中dispatch直接使用
  return function (state, action) {
   ...
  }
}
```

combineReducers的实现思路也很明确，遍历所有的reducer，通过命名空间，找到上一状态state树中当前reducer维护的state，并通过当前reducer变更得到新的state，最后将新的state同步到state树

```js
const combineReducers=(originReducers) => {
  const rKeys = Object.keys(originReducers)
  return function (state, action) {
    const nextState = {}
    for (let i = 0; i < rKeys.length; i++) {
      const key = rKeys[i]
      // 这里注意，如dispatch的是countReducer的action
      // 那么msgReducer会走到default分支，返回的是上一状态的msg，即没有变更
      nextState[key] = originReducers[key](state[key], action)
    }
    return nextState
  }
}
```

完整代码可见[demo3](https://github.com/qinjunyi/myRedux/tree/master/src/demo3)

### state剥离

上一版中state初始值是统一维护，放在一个state树中的，但更理想的是和对应的reducer放在一起维护，加个容错即可，以countReducer为例

```js
let initialState = { count: 0 }

const countReducer = (state, action) => {
  if (!state) {
    state = initialState
  }
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.payload }
      break
    case 'DECREMENT':
      return { count: state.count - action.payload }
      break
    default:
      return state
  }
}
export default countReducer
```

因为state初始值不统一在createStore前维护，那么在createStore时initialState为undefined，即总的state树初始值为undefined。第一次dispatch时就会走到reducer新加的容错中，因此create时触发一次dispatch，达到初始化的目的

```js
const createStore=(reducer, initialState) => {
  let state = initialState // 没有统一维护初始值，为undefined
	...
  const dispatch = (action) => {
    state = reducer(state, action) // 首次dispatch，state为undefined
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]()
    }
  }
  // 实质走到了reducer的default分支，会拿到各个reducer内部维护的初始state来初始总的state树
  dispatch({ type: Symbol() })
	...
}
```

combineReducers中返回的rootReducer也得加上容错

```js
const combineReducers = (originReducers) => {
  const rKeys = Object.keys(originReducers)
  return function (state, action) {
    const nextState = {}
    for (let i = 0; i < rKeys.length; i++) {
      const key = rKeys[i]
      const preState = state ? state[key] : undefined // 新加容错
      // 这里注意，每个单独的reducer维护的state初始值，不用加上命名空间，是因为在这合并到新的state树时，会使用reducer的命名空间
      nextState[key] = originReducers[key](preState, action)
    }
    return nextState
  }
}
```

使用时可以打印下state树，看看长啥样

```js
const reducers = combineReducers({ counter: countReducer, msg: msgReducer })

const store = createStore(reducers)
console.log('initialState:', store.getState())
...
```

完整代码可见[demo4](https://github.com/qinjunyi/myRedux/tree/master/src/demo4)

## 引入中间件

redux中还有个重要的概念 ，即中间件，下面这段话摘自redux中文官网

> 相对于 Express 或者 Koa 的 middleware，Redux middleware 被用于解决不同的问题，但其中的概念是类似的。**它提供的是位于 action 被发起之后，到达 reducer 之前的扩展点。** 你可以利用 Redux middleware 来进行日志记录、创建崩溃报告、调用异步接口或者路由等等。

 Express 或者 Koa的中间件，没接触过的可以查阅下相关文档，这里不再赘述。其实简单来说，中间件可以让redux状态变更更可控。

### 重写dispatch

中间件的本质是重写dispatch，增加一些额外操作。参考官方文档提及的例子，想要在dispatch时打印状态变更前后的state树，以及捕获变更时的异常，以此为目的分别重写dispatch

```js
const reducers = combineReducers({ counter: countReducer, msg: msgReducer })
const store = createStore(reducers)
const next = store.dispatch
// 打印日志
store.dispatch = (action) => {
  console.log('preState:', store.getState())
  next(action)
  console.log('nextState', store.getState())
}
// 捕获异常
store.dispatch = (action) => {
  try {
    console.log('preState:', store.getState())
    next(action)
    console.log('nextState', store.getState())
  } catch (e) {
    console.log('error:', e)
  }
}
```

### 抽成单独函数

将二者抽成单独的函数，并且组合在一起使用

```js
...
const loggerMiddleware = (action) => {
  console.log('preState:', store.getState())
  next(action)
  console.log('nextState', store.getState())
}

const exceptionMiddleware = (action) => {
  try {
    loggerMiddleware(action)
  } catch (e) {
    console.log('error:', e)
  }
}
store.dispatch = exceptionMiddleware
```

### 中间件之间解耦

exceptionMiddleware中直接用了loggerMiddleware，说明此时中间件之间存在耦合，那需要解耦操作一下，利用闭包包一层

```js
...
const loggerMiddleware = (next) => (action) => {
  console.log('preState:', store.getState())
  next(action)
  console.log('nextState', store.getState())
}
const exceptionMiddleware = (next) => (action) => {
  try {
    next(action)
  } catch (e) {
    console.log('error:', e)
  }
}
store.dispatch = exceptionMiddleware(loggerMiddleware(next))
```

### 剥离store

在某些中间件中还会用到store，基于函数式编程思想，也将store剥离，用闭包的方式再包一层

```js
...
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('preState:', store.getState())
  next(action)
  console.log('nextState', store.getState())
}
const exceptionMiddleware = (store) => (next) => (action) => {
  try {
    next(action)
  } catch (e) {
    console.log('error:', e)
  }
}
const logger = loggerMiddleware(store)
const exception = exceptionMiddleware(store)
store.dispatch = exception(logger(next))
```

完整代码可见[demo5](https://github.com/qinjunyi/myRedux/tree/master/src/demo5)

## 组合中间件

用过koa的老司机应该知道，koa源码中对于中间件会用一个compose函数去进行合并，形成经典的洋葱模型，可参考本人对于[koa源码](https://github.com/qinjunyi/myKoa)的研究。在redux中其实也有组合中间件的概念，声明一个applyMiddleware函数，预期是能组合各个中间件并且将createStore转换为新的createStore，形式如下

```js
const newCreateStore = applyMiddleware(loggerMiddleware,exceptionMiddleware)(createStore)
```

先将applyMiddleware的架子搭出来，闭包的第一层返回的是形参为原createStore的overrideCreateStoreFunc，最里层是返回同createStore一样，形参是reducers, initialState的newCreateStore

```js
const applyMiddleware = (...middlewares) => {
  return function overrideCreateStoreFunc(oldCreateStore) {
    return function newCreateStore(reducers, initialState) {
      ...
      return store
    }
  }
}
```

newCreateStore里的任务也很明确，第一是给各个中间件注入store，第二是组合各个中间件

```js
const applyMiddleware = (...middlewares) => {
  return function overrideCreateStoreFunc(oldCreateStore) {
    return function newCreateStore(reducers, initialState) {
      const store = oldCreateStore(reducers, initialState)
      const dispatch = store.dispatch
      const injectStoreMiddlewares = middlewares.map((middleware) =>
        middleware(store)
      )
      // 组合中间件
      const combineMiddlewares = compose(injectStoreMiddlewares)
      store.dispatch = combineMiddlewares(dispatch)
      return store
    }
  }
}
```

compose其实是实现demo5中注入store后中间件的组合

```js
// demo5
store.dispatch = exception(logger(next))
```

先看看源码中的实现，很巧妙，但也需要一定的功力(´▽｀)

```js
const compose = (middlewares) => {
  return middlewares.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  )
}
```

如果难以理解，换一种方式实现

```js
const compose = (middlewares,dispatch) => {
  let dispatchTmp = dispatch
  middlewares.reverse().map(middleware => {
    dispatchTmp = middleware(dispatchTmp)
  })
  return dispatchTmp
}
```

完整代码可见[demo6](https://github.com/qinjunyi/myRedux/tree/master/src/demo6)

## 对齐源码

### createStore

#### enhancer

demo6中applyMiddleware返回overrideCreateStoreFunc，换个角度可以理解为对createStore的加强，将它作为createStore的一个形参enhancer，如果存在则对createStore进行增强再返回。另外，原生Redux支持createStore(reducer, enhancer)这样使用，其实也就是加了个容错。

```js
const createStore = (reducer, initialState, enhancer) => {
  if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
    enhancer = initialState
    initialState = undefined
  }
  if (enhancer && typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, initialState)
  }
  ...
}
```

#### replaceReducer

源码的createStore还暴露出一个replaceReducer，用来变更reducer，实现很简单，替换加更新state树

```js
const createStore = (reducer, initialState, enhancer) => {
  ...
  const replaceReducer = (nextReducer) => {
    reducer = nextReducer
    // 同初始化，走到reducer的default分支，取到reducer内部维护的state初始值，以此重置state树
    dispatch({ type: Symbol() })
  }
  ...
   return { replaceReducer }
}
```

#### unsubscribe

既然可以订阅那就需要有取消订阅，安排

```js
const createStore = (reducer, initialState, enhancer) => {
  ...
  const subscribe = (listener) => {
    listeners.push(listener)
    return function unsubscribe() {
      const curIndex = listeners.indexOf(listener)
      listeners.splice(curIndex, 1)
    }
  }
	...
  return { subscribe }
}
```

### applyMiddleware

之前applyMiddleware时是将原store整个注入到中间件，但这样中间件里就可以重写store的一些原生api了，很明显这种破坏性的行为不符合预期，因此要避免这种情况

```js
const applyMiddleware = (...middlewares) => {
  return function overrideCreateStoreFunc(oldCreateStore) {
    return function enhancer(reducers, initialState) {
      const store = oldCreateStore(reducers, initialState)
      // 只暴露出getter
      const limitStore = { getState: store.getState }
      const dispatch = store.dispatch
      const injectStoreMiddlewares = middlewares.map((middleware) =>
        middleware(limitStore)
      )
      const combineMiddlewares = compose(injectStoreMiddlewares)
      store.dispatch = combineMiddlewares(dispatch)
      return store
    }
  }
}
```

### bindActionCreator

先看下相关概念在中文官网中的介绍

> *bindActionCreator*：
>
> 把一个 value 为不同 [action creator](https://www.redux.org.cn/docs/Glossary.html#action-creator) 的对象，转成拥有同名 key 的对象。同时使用 [`dispatch`](https://www.redux.org.cn/docs/api/Store.html#dispatch) 对每个 action creator 进行包装，以便可以直接调用它们。
>
> 惟一会使用到 `bindActionCreators` 的场景是当你需要把 action creator 往下传到一个组件上，却不想让这个组件觉察到 Redux 的存在，而且不希望把 [`dispatch`](https://www.redux.org.cn/docs/api/Store.html#dispatch) 或 Redux store 传给它。

> *Action Creator*：
>
>  就是一个创建 action 的函数。不要混淆 action 和 action creator 这两个概念。Action 是一个信息的负载，而 action creator 是一个创建 action 的工厂。

举个例子

```js
const actionCreators = {
  decrement: (val) => ({ type: 'DECREMENT', payload: val }),
  modifyContent: () => ({
    type: 'MODIFY_CONTENT',
    payload: { content: 'test' }
  })
}
```

actionCreators中就包含了俩Action Creator，为了进行状态变更时不暴露dispatch和store，那就需要做一些封装性的操作

```js
const actions = {
  decrement:(val) => store.dispatch(actionCreators.decrement(val)),
	modifyContent:() => store.dispatch(actionCreators.modifyContent())
}
// actions可以export到任何地方，这样就避免传递dispatch合store了
actions.decrement(2)
actions.modifyContent()
```

这种封装性的操作需要统一处理下，否则每有一个Action Creator就需扩展一个actions，其实就是实现bindActionCreator

```js
const bindActionCreator = (actionCreator, dispatch) => {
  return function () {
    return dispatch(actionCreator.apply(this, arguments))
  }
}
const bindActionCreators = (actionCreators, dispatch) => {
  // 官网支持actionCreators是单个或者由多个Action Creator组成的对象，因此加上容错
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error()
  }
  const boundActionCreator = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreator[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreator
}
```

思路比较简单，本质就是提取下公共代码

至此，一个高度还原的Redux就实现了，完整代码可见[demo7](https://github.com/qinjunyi/myRedux/tree/master/src/demo7)。当然源码中还有很多容错校验，可以参考源码进行研究学习

## 总结

本文对redux的探索是层层递进的方式去进行，这个思路得益于[brickspert](https://github.com/brickspert)大佬的这篇[文章](https://github.com/brickspert/blog/issues/22)，“站在巨人肩膀上前行”，给大佬点个赞。自己在实现的过程中也有很多其他的见解和感受。同时自己也将redux源码整体过了一遍，学习的不仅是代码更多的是思路和想法。

## P.S

本仓库是使用rollup进行打包，若想要调试某个demo需要将[gulpfile](https://github.com/qinjunyi/myRedux/blob/master/gulpfile.js)中inputOptions的入口文件路径改为对应的demoX

```js
const inputOptions = {
  input: path.resolve(__dirname, './src/demoX/index.js'),
  ...
}
```



