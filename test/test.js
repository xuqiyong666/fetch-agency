
const dayjs = require('dayjs')

const FetchAgency = require('../dist/index').default

console.log("FetchAgency", FetchAgency)

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// 模拟一个耗时3秒的接口
const fetchApiData = async () => {
  await sleep(3000)

  return {
    number: Math.floor(Math.random() * 100000)
  }
}

const fetchCase = async (index) => {
  console.log(`[${index}] before call fetchApiData`)
  const apiData = await FetchAgency.fetch({
    key: "apiData",
    execute: () => {
      console.log(`[${index}] fetchApiData!`)
      return fetchApiData()
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






