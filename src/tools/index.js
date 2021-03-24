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
