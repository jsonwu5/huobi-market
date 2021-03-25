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
  "tableWidths"
];

/**
 * 同步缓存到chrome账号
 * @param obj { Object } 需要缓存的键值对象
 */
export function setStorage(obj) {
  chrome.storage.sync.set(obj);
}

/**
 * 从chrome账户获取缓存数据
 * @param key { String | Array } 键值名称/键值数组
 * @returns {Promise<unknown>}
 */
export function getStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, resolve);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 同步缓存到chrome账号
 * @param obj { Object } 需要缓存的键值对象
 */
export function setLocalStorage(obj) {
  chrome.storage.local.set(obj);
}

/**
 * 从chrome账户获取缓存数据
 * @param key { String | Array } 键值名称/键值数组
 * @returns {Promise<unknown>}
 */
export function getLocalStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, resolve);
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
      chrome.storage.sync.clear(resolve);
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
