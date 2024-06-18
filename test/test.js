
const dayjs = require('dayjs')

const { FetchMan } = require('../dist/index')

console.log("FetchMan", FetchMan)

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// 模拟一个耗时3秒的接口
const fetchApiData = async (params) => {
  await sleep(3000)

  return {
    params,
    result: Math.floor(Math.random() * 100000)
  }
}

const fetchCase = async (index) => {
  console.log(`[${index}] call fetchCategoryTestData`)

  const apiData = await FetchMan.fetch({
    key: "apiData?category=test",
    execute: () => {
      const params = { category: "test" }
      console.log(`[${index}] fetchApiData! ${JSON.stringify(params)}`)
      return fetchApiData(params)
    },
  })

  console.log(`[${index}] apiData loaded`, apiData)
}

const main = async () => {

  let reqCount = 10

  for (let i = 1; i <= reqCount; i++) {
    fetchCase(i)
  }
}

main()






