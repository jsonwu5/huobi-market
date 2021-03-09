import Vue from "vue";
import Vuex from "vuex";
import $http from "@/http";

Vue.use(Vuex);

/**
 * 获取本地缓存
 * @param key { String }
 * @returns {any|undefined}
 */
function getStorageItem(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : undefined;
}

/*
 * 根据关键字搜索
 * @param list { Array } 原数组
 * @param keyWord { String } 查询的关键词
 * @returns {[]} 匹配的结果
 */
function searchByKeyword(list, keyWord) {
  const reg = new RegExp(keyWord);
  const arr = [];
  for (let i = 0; i < list.length; i++) {
    if (reg.test(list[i])) {
      arr.push(list[i]);
    }
  }
  return arr;
}

export default new Vuex.Store({
  state: {
    // 所有支持的币列表
    coinList: [],
    // 我的自选币种列表
    myCoinList: getStorageItem("myCoinList") || [],
    // 行情表格展示的字段
    tableKeys: getStorageItem("tableKeys") || [],
    // 置顶自选币种列表
    stickList: getStorageItem("stickList") || [],
    // Manifest配置文件
    manifest: {},
    // 币种选择器 币种列表
    coinSelectList: [],
    // 用户配置数据
    userOptions: getStorageItem("userOptions") || {}
  },
  mutations: {
    _setCoinList(state, val) {
      state.coinList = val;
    },
    _setMyCoinList(state, val) {
      state.myCoinList = val;
      localStorage.setItem("myCoinList", JSON.stringify(val));
    },
    _setTableKeys(state, val) {
      state.tableKeys = val;
      localStorage.setItem("tableKeys", JSON.stringify(val));
    },
    _setStickyList(state, val) {
      state.stickList = val;
      localStorage.setItem("stickList", JSON.stringify(val));
    },
    _setManifest(state, val) {
      state.manifest = val;
    },
    _setCoinSelectList(state, val) {
      state.coinSelectList = val;
    },
    _setUserOptions(state, val) {
      state.userOptions = val;
      localStorage.setItem("userOptions", JSON.stringify(val));
    }
  },
  actions: {
    // 获取火币支持的币种
    _getCoinList({ commit }) {
      $http.get("/common/currencys").then(res => {
        commit("_setCoinList", res);
      });
    },
    // 获取当前的manifest.json配置
    _getManifest({ commit }) {
      // 通过API
      commit("_setManifest", chrome.runtime.getManifest());
      // 通过请求
      // $http.get(chrome.extension.getURL("manifest.json")).then(res => {
      //   commit("_setManifest", res);
      // });
    },
    /**
     * 分页查询币种列表，支持关键字过滤
     * @param commit
     * @param state
     * @param pageNumber { Number } 页码
     * @param resultSize { Number } 每天条数
     * @param coinName { String } 搜索的币种关键字
     * @private
     */
    _getCoinPager({ commit, state }, { pageNumber, resultSize, coinName }) {
      let list = state.coinList;
      // 搜索过滤
      if (coinName) {
        list = searchByKeyword(state.coinList, coinName);
      }
      let res = {
        // 1 10  0 10
        // 2 10  10 20
        // 3 10 20 30
        list: list.slice(
          (pageNumber - 1) * resultSize,
          (pageNumber - 1) * resultSize + resultSize
        ),
        total: list.length
      };
      return new Promise(resolve => {
        const timer = setTimeout(() => {
          commit("_setCoinSelectList", res.list);
          clearTimeout(timer);
          resolve(res);
        }, 100);
      });
    }
  },
  modules: {}
});
