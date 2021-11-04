# MyRedux

## 前言

​		公司大部分后台项目都在用umi，让之前我这个只写vue的前端搬砖员接触到了很多新的思想、插件、开发模式等等，其中redux对我来说就是个新鲜的工具。刚接触时，心想这玩意儿跟vuex长得差不多啊，后来上网查了查“vuex和redux的区别”，原来尤大是借鉴了redux的思想，给vue定制了一套状态管理器，难怪如此相像。

  		“Redux 是 JavaScript 状态容器，提供可预测化的状态管理”这是redux官网上的简介，基于此研究下redux内部到底是如何管理js状态的，并且实现一个简易版的Redux。

## 初代

既然是个状态容器，就命名为store吧（为啥不叫container？因为官方叫store），再声明个类似构造函数的create函数？ok，就定义一个createStore。管理状态，很容易就想到这个store需要一个setter，一个getter，另外状态可预测，那么应该有个watcher。

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

因为不统一在initialState中维护，那么在createStore中初始state为undefined，所以第一次dispatch时，会走到新加的容错中

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

