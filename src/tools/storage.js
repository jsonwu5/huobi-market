// 分片存储，解决单个storage item不能超过8kb的问题
import "chrome-storage-largesync/dist/chrome-Storage-largeSync.js";

// 需要chrome账号同步的Storage key名称列表
export const KYELIST = [
  "myCoinList",
  "tableKeys",
  "stickList",
  "userOptions",
  "upsColor",
  "badgeCoin",
  "sortConfig",
  "userLang",
  "tableWidths",
  "buySellRecords"
];

/**
 * 同步缓存到chrome账号
 * @param obj { Object } 需要缓存的键值对象
 */
export function setStorage(obj) {
  chrome.storage.largeSync.set(obj);
}

/**
 * 从chrome账户获取缓存数据
 * @param keys { String | Array } 键值名称/键值数组
 * @returns {Promise<unknown>}
 */
export function getStorage(keys) {
  // 只能传递数组给largeSync，否则取不出值
  let key = typeof keys === "string" ? [keys] : keys;
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.largeSync.get(key, resolve);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 缓存本地
 * @param obj { Object } 需要缓存的键值对象
 */
export function setLocalStorage(obj) {
  chrome.storage.local.set(obj);
}

/**
 * 从本地获取缓存数据
 * @param key { String | Array } 键值名称/键值数组
 * @returns {Promise<unknown>}
 */
export function getLocalStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, resolve);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 清除sync缓存
 * @returns {Promise<unknown>}
 */
export function clearStorage() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.largeSync.clear(resolve);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 清除local缓存
 * @returns {Promise<unknown>}
 */
export function clearLocalStorage() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.clear(resolve);
    } catch (e) {
      reject(e);
    }
  });
}
