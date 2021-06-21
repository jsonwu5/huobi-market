import pako from "pako";
import NP from "number-precision";

/**
 *  万能函数节流 限制timeout ms内只能被触发一次。 无论你点击有多快，timeout ms也只会执行一次。
 * @param fn { Function } 事件处理函数
 * @param timeout { Number } 节流间隔
 * @return:
 */
export function throttle(fn, timeout) {
  /* 核心技术介绍
      1. 函数节流需要使用变量来存储  上一次触发时间
      2. 这个变量如果是局部变量 ： 则函数完毕会被回收。 如果是全局变量：则会造成全局变量污染
      3.解决方案 ： 利用函数本身也是对象，使用函数本身的静态成员来存储 上一次触发时间
      */
  // 给throttle添加静态成员lastTime
  if (!throttle.lastTime) {
    /* 为什么一定要有这一步呢？
            因为函数对象的属性不存在时，默认取值会得到undefined，而undefined在做数学计算
            的时候会转成number类型得到NaN. Number(undefined) 结果是NaN。无法计算
             */
    throttle.lastTime = 0;
  }

  // 1.记录当前时间
  const currentTime = new Date().getTime();
  // 2.判断触发时间间隔
  if (currentTime - throttle.lastTime > timeout) {
    fn();
    // 3.将当前时间作为 下一次触发时间 参考时间
    throttle.lastTime = currentTime;
  }
}

/**
 * 万能防抖函数 用户连续多次触发某个事件，则只执行最后一次
 * @param fn { Function } 事件处理函数
 * @param timeout { Number } 防抖时间间隔
 * @return:
 */
export function deBonce(fn, timeout) {
  /* 核心技术点
      1.函数防抖需要使用定时器id, 这个id不能是局部的（函数走完之后会被回收）
      2.定时器id也不能是全局的，造成全局变量污染
      3.解决方案：
          (1)使用闭包延长局部变量生命周期，但是闭包语法很繁琐
          (2)利用函数本身也是对象，使用函数本身的静态成员来存储定时器ID
      */
  // 1.先清除上一次触发事件 的定时器
  clearTimeout(deBonce.timeID);
  // 2.以最后一次触发 为准
  deBonce.timeID = setTimeout(fn, timeout);
}

/**
 * 格式化数字，向下取整，不四舍五入
 * @param val { Number } 数值
 * @returns {string|number}
 */
export function formatNum(val) {
  let num = parseFloat(val);
  let absNum = Math.abs(num);
  if (absNum < 10) {
    return Math.floor(num * 100) / 100;
  } else if (absNum < 100) {
    return Math.floor(num * 10) / 10;
  } else if (absNum < 1000) {
    return num.toFixed(0);
  } else if (absNum < 10000) {
    return Math.floor((num / 1000) * 10) / 10 + "k";
  } else if (absNum < 1000000) {
    return Math.floor(num / 1000) + "k";
  } else if (absNum < 10000000) {
    return Math.floor((num / 1000000) * 10) / 10 + "m";
  } else {
    return Math.floor(num / 1000000) + "m";
  }
}

/**
 * 获取本地缓存
 * @param key { String }
 * @returns {any|undefined}
 */
export function getStorageItem(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : undefined;
}

/*
 * 根据关键字搜索
 * @param list { Array } 原数组
 * @param keyWord { String } 查询的关键词
 * @returns {[]} 匹配的结果
 */
export function searchByKeyword(list, keyWord) {
  const reg = new RegExp(keyWord);
  const arr = [];
  for (let i = 0; i < list.length; i++) {
    if (reg.test(list[i])) {
      arr.push(list[i]);
    }
  }
  return arr;
}

/**
 * 分割数组为每num个为一组
 * @param array
 * @param num { Number } 每组多少个
 * @param complete { Boolean } 是否补全最后一组
 * @returns {[]}
 */
export function splitArr(array, num = 2, complete = false) {
  let index = 0;
  const newArray = [];
  while (index < array.length) {
    newArray.push(array.slice(index, (index += num)));
  }
  const lastItem = newArray[newArray.length - 1];
  // 是否补全最后一个
  if (complete && lastItem.length < num) {
    for (let i = 0; i < num - lastItem.length; i++) {
      newArray.push(lastItem[0]);
    }
  }
  return newArray;
}

/**
 * 解压websocket返回的数据
 * @param e { Object } 返回的数据
 * @param callback { Function } 回调函数
 */
export function blob2json(e, callback) {
  let reader = new FileReader();
  reader.readAsArrayBuffer(e, "utf-8");
  reader.onload = function() {
    // console.log("blob转ArrayBuffer数据类型", reader.result);
    // 对数据进行解压
    let msg = pako.ungzip(reader.result, {
      to: "string"
    });
    // console.log("ArrayBuffer转字符串", msg);
    callback && callback(JSON.parse(msg));
  };
}

/**
 * 根据key获取url上的值
 * @param key { String } 键名
 * @param url { String } 带参数的url
 * @returns {string|null}
 */
export function getQueryString(key, url = "") {
  const href = url ? url : window.location.href;
  const reg = new RegExp("[?&]" + key + "=([^&]*)", "i");
  const string = reg.exec(href);
  return string ? string[1] : null;
}

/**
 * 分页获取数据
 * @param list { Array } 数据源
 * @param pageNumber { Number } 页码
 * @param resultSize { Number } 每页条数
 * @param startTime { Date } 起始时间
 * @param endTime { Date } 结束时间
 * @returns {Promise<unknown>}
 */
export function getDataByPage(
  list,
  { pageNumber, resultSize, startTime, endTime }
) {
  let data = list;
  if (startTime && endTime) {
    data = list.filter(item => {
      const created = new Date(item.created).getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      return created >= start && created <= end;
    });
  }
  let res = {
    // 1 10  0 10
    // 2 10  10 20
    // 3 10 20 30
    list: data.slice(
      (pageNumber - 1) * resultSize,
      (pageNumber - 1) * resultSize + resultSize
    ),
    total: list.length
  };
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve(res);
    }, 100);
  });
}

/**
 * 计算单个币种收益
 * @param coinName { String } 币种名称
 * @param coinData { Array } 币种最新价格数据包对象
 * @param arr { Array } 加减仓记录数组
 * @returns {*&{gainsUps: number, todayGains: number, flatCost: number, costPrice: (number|number), tick, list: {saleAmount, buyCount, gainsUps: number, saleCount, todayGains: number, buy, flatCost: number, costPrice: (number|number), gains: number, todayGainsUps: number, saleVolume, sale, saleCostPrice: (number|number), coinOpen, buyAmount, coinClose, buyAveragePrice: (number|number), totalNetValue: number, buyCounts, coinCount: number}, gains: number, todayGainsUps: number, saleCostPrice: (number|number), name, id, averagePrice: (number|number), close, totalNetValue: number, coinCount: number}}
 */
export function calcEarnings(coinName, coinData, arr) {
  // item中的字段说明
  //  {
  //   amount: 520.1395,               // 数量
  //   coin: "oxt",                    // 币种
  //   created: "2021-04-23 10:37:00", // 时间
  //   points: 1.040279,               // 手续费
  //   pointsUnit: "oxt",              // 手续费币种
  //   price: 0.5278,                  // 价格
  //   realAmount: 519.099221,         // 减去手续费的实际数量
  //   realVolume: 274.5296281,        // 减去手续费的实际成交额
  //   role: "买入",                    // 方向
  //   symbol: "oxt/usdt",             // 交易对
  //   type: "币币交易",                 // 交易类型
  //   volume: 274.5296281             // 成交额
  // };
  const buy = arr.filter(a => a.role === "买入");
  const sale = arr.filter(a => a.role === "卖出");
  // 币种最新价
  const coinClose = coinData.close;
  // 币种开盘价
  const coinOpen = coinData.open;
  // 币涨跌幅
  coinData.ups =
    coinClose > 0
      ? NP.times(
          NP.round(NP.divide(NP.minus(coinClose, coinOpen), coinOpen), 4),
          100
        )
      : 0;

  // N次买入的币总数量（减去手续费后的实际数量）
  const buyCount = buy.reduce((a, b) => NP.plus(a, b.realAmount), 0);
  // N次买入币总数量（含手续费）
  const buyCounts = buy.reduce((a, b) => NP.plus(a, b.realAmount), 0);
  // N次买入总金额
  const buyAmount = buy.reduce((a, b) => NP.plus(a, b.volume), 0);

  // N次卖出的币总数量
  const saleCount = sale.reduce((a, b) => NP.plus(a, b.realAmount), 0);
  // N次卖出总金额（减去手续费后的实际总金额）
  const saleAmount = sale.reduce((a, b) => NP.plus(a, b.realVolume), 0);
  // N次卖出总金额（含手续费）
  const saleVolume = sale.reduce((a, b) => NP.plus(a, b.volume), 0);
  // 卖出均价 = N次卖出总金额（含手续费） / N次卖出总数量
  const saleCostPrice = saleCount > 0 ? NP.divide(saleVolume, saleCount) : 0;
  // 买入均价 = N次买入总金额 / N次买入币总数量（含手续费）
  const buyAveragePrice = buyCounts > 0 ? NP.divide(buyAmount, buyCounts) : 0;

  // 持币数量 = N次买入的币总数量（减去手续费的实际数量） - N次卖出的币总数量
  const coinCount = NP.minus(buyCount, saleCount);
  // 成本价 = （N次买入总金额 - N次卖出总金额（含手续费））/ 持币数量
  const costPrice =
    coinCount === 0 ? 0 : NP.divide(NP.minus(buyAmount, saleVolume), coinCount);
  // 当前持币总价值 = 持币数量 * 币最新价
  const totalNetValue = NP.times(coinCount, coinClose);
  // 总收益 = 当前持币总价值 + 卖出的总金额（减去手续费的实际金额） - N次买入总金额
  const gains = NP.minus(NP.plus(totalNetValue, saleAmount), buyAmount);
  // 当天的收益估算金额 = (最新价 - 开盘价) * 持有数量
  const todayGains = NP.times(NP.minus(coinClose, coinOpen), coinCount);
  // 当天的收益涨跌幅 = (最新价 - 成本价) / 成本价 - (开盘价 - 成本价) / 成本价
  let todayGainsUps = NP.minus(
    NP.divide(NP.minus(coinClose, costPrice), costPrice),
    NP.divide(NP.minus(coinOpen, costPrice), costPrice)
  );
  todayGainsUps = NP.times(NP.round(todayGainsUps, 4), 100);
  // 单个币种总收益率 = 总收益 / N次买入总金额
  let gainsUps = NP.round(NP.divide(gains, buyAmount), 4);
  gainsUps = NP.times(gainsUps, 100);
  // 净成本 = 买入总金额 - N次卖出总金额（含手续费）
  const flatCost = NP.minus(buyAmount, saleVolume);
  const listItem = {
    id: coinName,
    close: coinClose,
    tick: coinData,
    ...coinData,
    name: coinName,
    // 持币数量
    coinCount,
    // 买入均价
    averagePrice: buyAveragePrice,
    // 成本价
    costPrice,
    // 持有价值
    totalNetValue,
    // 总收益
    gains,
    // 持币总收益率
    gainsUps,
    // 当天的收益估算金额
    todayGains,
    // 当天的收益涨跌幅
    todayGainsUps,
    // 卖出均价
    saleCostPrice,
    // 净成本
    flatCost,
    // 开发调试查看数据用
    list: {
      buy,
      sale,
      coinClose,
      coinOpen,
      buyCount,
      buyCounts,
      buyAmount,
      saleCount,
      saleAmount,
      saleVolume,
      saleCostPrice,
      buyAveragePrice,
      coinCount,
      costPrice,
      totalNetValue,
      gains,
      todayGains,
      todayGainsUps,
      gainsUps,
      flatCost
    }
  };
  return listItem;
}
