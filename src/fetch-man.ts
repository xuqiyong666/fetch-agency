interface FetchOptions {
  key: string
  execute: () => any,
  waitTime?: number,
  keepTime?: number
}

interface StoreItem {
  key: string // 数据唯一标识
  t: number // 最后一次发起请求的时间
  data: any // 最终数据
  consumers: Consumer[] // 消费者列表
}

interface Consumer {
  resolve: (data: any) => void,
  reject: (error: Error) => void
}

// 存储数据
const Store: Map<string, StoreItem> = new Map()

const getOrCreateStoreItem = (key: string) => {
  const savedItem = Store.get(key)
  if (savedItem) return savedItem

  const newItem = {
    key: key,
    t: 0,
    data: undefined,
    consumers: []
  }

  Store.set(key, newItem)

  return newItem
}

const fetch = (options: FetchOptions) => {
  return new Promise((resolve, reject) => {
    const storeItem = getOrCreateStoreItem(options.key)
    const consumer = { resolve, reject }
    storeItem.consumers.push(consumer)

    fetchBase(options)
  })
}

const fetchBase = (options: FetchOptions) => {
  const { key, execute } = options

  const storeItem = Store.get(key)
  if (!storeItem) return

  // 如果存在缓存数据，直接返回
  const cacheData = storeItem.data
  if (cacheData !== undefined) {
    broadcastData(cacheData, key)
    return
  }

  // 经过多长时间如果数据还没有返回，则下一次调用将会额外发起另一个请求
  let waitTime = options.waitTime
  if (waitTime === undefined) waitTime = 1

  const timeNow: number = Date.now()

  // 基于时间，判断是否跳过本次请求
  const isSkip: Boolean = storeItem.t + waitTime * 1000 >= timeNow
  if (isSkip) return

  storeItem.t = timeNow

  // 请求的数据保留多久，默认立即清除
  const keepTime: number = options.keepTime || 0

  asyncWrap(execute).then((data: any) => {
    if (data === undefined) return

    // 如果已经获取到数据，则忽略后来的数据
    if (storeItem.data !== undefined) return

    storeItem.data = data

    // 数据发送给所有消费者
    broadcastData(data, key)

    if (keepTime) {
      // 正常数据的缓存支持保留一段时间再删除

      window.setTimeout(() => {
        Store.delete(key)
      }, keepTime * 1000)
    } else {
      Store.delete(key)
    }
  }).catch((error: Error) => {
    // 错误发送给所有消费者
    broadcastError(error, key)

    // 异常数据的缓存立即清除
    Store.delete(key)
  })
}

// 同步转异步
const asyncWrap = async (exection: () => any) => {
  return exection()
}

const broadcastData = (data: any, key: string) => {
  const storeItem = Store.get(key)
  if (!storeItem) return

  storeItem.consumers.forEach((consumer) => {
    consumer.resolve(data)
  })

  // 广播过之后，清空消费者列表
  storeItem.consumers = []
}

const broadcastError = (error: Error, key: string) => {
  const storeItem = Store.get(key)
  if (!storeItem) return

  storeItem.consumers.forEach((consumer) => {
    consumer.reject(error)
  })

  // 广播过之后，清空消费者列表
  storeItem.consumers = []
}

const FetchMan = {
  fetch
}

export default FetchMan